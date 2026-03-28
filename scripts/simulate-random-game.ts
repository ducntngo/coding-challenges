import assert from "node:assert/strict";

import { createApp } from "../src/app/create-app";
import {
  buildDefaultDependencies,
  type AppDependencies,
} from "../src/app/dependencies";
import type {
  QuizDefinition,
  QuizDefinitionSource,
} from "../src/quiz-source/contracts";
import type { SessionSnapshot } from "../src/session/contracts";
import type {
  CommandRejectedPayload,
  LeaderboardUpdatedPayload,
  OutboundEventEnvelope,
  ParticipantScoreUpdatedPayload,
  SessionJoinPayload,
  SessionSnapshotPayload,
  TransportSessionView,
} from "../src/transport/contracts";
import {
  buildWebSocketUrl,
  SimulationClient,
} from "./support/simulation-client";

const QUIZ_ID = "demo-quiz";
const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_MIN_PLAYERS = 2;
const DEFAULT_MAX_PLAYERS = 5;
const DEFAULT_ROUND_DURATION_MS = 5_000;
const DEFAULT_LATE_WINDOW_MS = 2_000;
const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dana", "Eve"] as const;
const QUESTIONS: readonly SimulatedQuestion[] = [
  {
    questionId: "question-1",
    acceptedAnswer: "anchor",
    answerPool: ["anchor", "bridge", "cabin", "desert"],
  },
  {
    questionId: "question-2",
    acceptedAnswer: "forest",
    answerPool: ["forest", "garden", "harbor", "island"],
  },
  {
    questionId: "question-3",
    acceptedAnswer: "lantern",
    answerPool: ["lantern", "mirror", "needle", "orchard"],
  },
];

interface SimulatedQuestion {
  readonly questionId: string;
  readonly acceptedAnswer: string;
  readonly answerPool: readonly string[];
}

interface SimulationPlayer {
  readonly name: string;
  readonly client: SimulationClient;
  readonly joinPayload: TransportSessionView;
}

interface PlannedAnswer {
  readonly player: SimulationPlayer;
  readonly submittedAtMs: number;
  readonly answer: string;
  readonly withinRound: boolean;
}

class ManualClock {
  private currentMs = 0;

  now = (): number => this.currentMs;

  advanceTo(nextMs: number): void {
    this.currentMs = Math.max(this.currentMs, nextMs);
  }
}

class StaticQuizDefinitionSource implements QuizDefinitionSource {
  private readonly quizzes: Map<string, QuizDefinition>;

  constructor(quizzes: readonly QuizDefinition[]) {
    this.quizzes = new Map(quizzes.map((quiz) => [quiz.quizId, quiz]));
  }

  async getQuizDefinition(quizId: string): Promise<QuizDefinition | null> {
    return this.quizzes.get(quizId) ?? null;
  }
}

async function main(): Promise<void> {
  const timeoutMs = parsePositiveInt(
    process.env.SIMULATE_RANDOM_GAME_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const minPlayers = clamp(
    parsePositiveInt(
      process.env.SIMULATE_RANDOM_GAME_MIN_PLAYERS,
      DEFAULT_MIN_PLAYERS,
    ),
    2,
    PLAYER_NAMES.length,
  );
  const maxPlayers = clamp(
    parsePositiveInt(
      process.env.SIMULATE_RANDOM_GAME_MAX_PLAYERS,
      DEFAULT_MAX_PLAYERS,
    ),
    minPlayers,
    PLAYER_NAMES.length,
  );
  const roundDurationMs = parsePositiveInt(
    process.env.SIMULATE_RANDOM_GAME_ROUND_MS,
    DEFAULT_ROUND_DURATION_MS,
  );
  const lateWindowMs = parsePositiveInt(
    process.env.SIMULATE_RANDOM_GAME_LATE_WINDOW_MS,
    DEFAULT_LATE_WINDOW_MS,
  );
  const seed = parsePositiveInt(
    process.env.SIMULATE_RANDOM_GAME_SEED,
    Date.now(),
  );
  const random = createSeededRandom(seed);
  const playerCount = randomIntInRange(random, minPlayers, maxPlayers);
  const selectedNames = PLAYER_NAMES.slice(0, playerCount);
  const focusPlayerName =
    selectedNames[randomIntInRange(random, 0, selectedNames.length - 1)];

  assert.ok(focusPlayerName);

  const clock = new ManualClock();
  const deps = buildRandomSimulationDependencies(clock);
  const app = createApp({
    deps,
    logger: false,
  });
  const players: SimulationPlayer[] = [];

  console.log(
    `[simulate:random-game] seed=${seed} players=${playerCount} focus=${focusPlayerName} roundMs=${roundDurationMs}`,
  );

  try {
    const address = await app.listen({
      host: "127.0.0.1",
      port: 0,
    });
    const wsUrl = buildWebSocketUrl(address, "/ws");

    console.log(`[simulate:random-game] local simulation server at ${wsUrl}`);

    for (const [index, name] of selectedNames.entries()) {
      const client = await SimulationClient.connect(wsUrl, timeoutMs);
      const joinEvent = await client.sendCommand<SessionJoinPayload>({
        command: "session.join",
        requestId: `req-join-${name.toLowerCase()}`,
        payload: {
          quizId: QUIZ_ID,
          displayName: name,
        },
      });
      const joinPayload = assertSessionJoin(joinEvent, name, index + 1);

      players.push({
        name,
        client,
        joinPayload,
      });
    }

    console.log(
      `[simulate:random-game] joined players: ${players.map((player) => player.name).join(", ")}`,
    );
    printLeaderboard("initial", players[0]?.joinPayload.leaderboard ?? []);

    for (const [questionIndex, question] of QUESTIONS.entries()) {
      await runQuestionRound({
        deps,
        clock,
        players,
        focusPlayerName,
        question,
        roundIndex: questionIndex + 1,
        roundDurationMs,
        lateWindowMs,
        random,
      });
    }

    const finalSnapshot = await deps.sessionService.getSessionSnapshot(QUIZ_ID);

    assert.ok(finalSnapshot);
    assert.equal(finalSnapshot.phase, "finished");

    printLeaderboard("final", finalSnapshot.leaderboard);
    console.log("[simulate:random-game] simulation completed successfully");
  } finally {
    await Promise.allSettled(players.map(async (player) => player.client.close()));
    await app.close();
  }
}

async function runQuestionRound(params: {
  readonly deps: AppDependencies;
  readonly clock: ManualClock;
  readonly players: readonly SimulationPlayer[];
  readonly focusPlayerName: string;
  readonly question: SimulatedQuestion;
  readonly roundIndex: number;
  readonly roundDurationMs: number;
  readonly lateWindowMs: number;
  readonly random: () => number;
}): Promise<void> {
  const roundStartMs = params.clock.now();
  const roundCloseMs = roundStartMs + params.roundDurationMs;
  const plans = buildPlannedAnswers({
    players: params.players,
    question: params.question,
    roundStartMs,
    roundDurationMs: params.roundDurationMs,
    lateWindowMs: params.lateWindowMs,
    random: params.random,
  });

  console.log(
    `[simulate:random-game] round ${params.roundIndex} question=${params.question.questionId} window=${formatSeconds(roundStartMs)}-${formatSeconds(roundCloseMs)}`,
  );

  for (const plan of plans) {
    console.log(
      `[simulate:random-game] plan ${plan.player.name} answer="${plan.answer}" at ${formatSeconds(plan.submittedAtMs)} ${plan.withinRound ? "in-time" : "late"}`,
    );
  }

  for (const plan of plans.filter((candidate) => candidate.withinRound)) {
    params.clock.advanceTo(plan.submittedAtMs);
    const passivePlayers = params.players.filter(
      (player) => player.name !== plan.player.name,
    );

    const [commandEvents, ...passiveEventGroups] = await Promise.all([
      plan.player.client.sendCommandAndReadEvents(
        {
          command: "answer.submit",
          requestId: `req-${params.question.questionId}-${plan.player.name.toLowerCase()}`,
          payload: {
            questionId: params.question.questionId,
            answer: plan.answer,
          },
        },
        2,
      ),
      ...passivePlayers.map((player) => player.client.readEvents(2)),
    ]);
    const allObservedEvents = new Map<string, OutboundEventEnvelope[]>();

    allObservedEvents.set(plan.player.name, commandEvents);

    for (const [index, player] of passivePlayers.entries()) {
      allObservedEvents.set(player.name, passiveEventGroups[index] ?? []);
    }

    logFocusEvents(
      params.focusPlayerName,
      `answer by ${plan.player.name} at ${formatSeconds(plan.submittedAtMs)}`,
      allObservedEvents,
    );
    printLeaderboard(
      `${params.question.questionId} after ${plan.player.name}`,
      extractLeaderboardFromEvents(commandEvents) ??
        (await requireSnapshot(params.deps)).leaderboard,
    );
  }

  params.clock.advanceTo(roundCloseMs);

  await params.deps.progressionService.closeCurrentQuestion(QUIZ_ID);
  const closedEventGroups = await Promise.all(
    params.players.map((player) => player.client.readEvents(1)),
  );
  const closedEvents = new Map<string, OutboundEventEnvelope[]>(
    params.players.map((player, index) => [player.name, closedEventGroups[index] ?? []]),
  );

  assertSnapshotEvents(
    closedEventGroups,
    "question_closed",
    params.question.questionId,
  );
  logFocusEvents(
    params.focusPlayerName,
    `question close for ${params.question.questionId}`,
    closedEvents,
  );
  printLeaderboard(
    `${params.question.questionId} closed`,
    (await requireSnapshot(params.deps)).leaderboard,
  );

  for (const plan of plans.filter((candidate) => !candidate.withinRound)) {
    params.clock.advanceTo(plan.submittedAtMs);

    const rejectionEvent = await plan.player.client.sendCommand({
      command: "answer.submit",
      requestId: `req-${params.question.questionId}-${plan.player.name.toLowerCase()}-late`,
      payload: {
        questionId: params.question.questionId,
        answer: plan.answer,
      },
    });

    assertRejectedAnswer(rejectionEvent);
    await Promise.all(
      params.players
        .filter((player) => player.name !== plan.player.name)
        .map((player) => player.client.expectNoEventWithin(50)),
    );

    const allObservedEvents = new Map<string, OutboundEventEnvelope[]>(
      params.players.map((player) => [
        player.name,
        player.name === plan.player.name ? [rejectionEvent] : [],
      ]),
    );
    allObservedEvents.set(plan.player.name, [rejectionEvent]);

    logFocusEvents(
      params.focusPlayerName,
      `late answer by ${plan.player.name} at ${formatSeconds(plan.submittedAtMs)}`,
      allObservedEvents,
    );
    console.log(
      `[simulate:random-game] late answer rejected for ${plan.player.name}`,
    );
  }

  await params.deps.progressionService.advanceToNextQuestion(QUIZ_ID);
  const advanceEventGroups = await Promise.all(
    params.players.map((player) => player.client.readEvents(1)),
  );
  const advanceEvents = new Map<string, OutboundEventEnvelope[]>(
    params.players.map((player, index) => [player.name, advanceEventGroups[index] ?? []]),
  );
  assertSnapshotEvents(
    advanceEventGroups,
    params.roundIndex === QUESTIONS.length ? "finished" : "question_open",
    params.roundIndex === QUESTIONS.length
      ? null
      : QUESTIONS[params.roundIndex]?.questionId ?? null,
  );
  logFocusEvents(
    params.focusPlayerName,
    `advance after ${params.question.questionId}`,
    advanceEvents,
  );

  const snapshot = await requireSnapshot(params.deps);
  printLeaderboard(`${params.question.questionId} advanced`, snapshot.leaderboard);
}

function buildRandomSimulationDependencies(clock: ManualClock): AppDependencies {
  const quizDefinitionSource = new StaticQuizDefinitionSource([
    {
      quizId: QUIZ_ID,
      title: "Randomized Demo Quiz",
      questionIds: QUESTIONS.map((question) => question.questionId),
      questions: QUESTIONS.map((question) => ({
        questionId: question.questionId,
        acceptedAnswer: question.acceptedAnswer,
      })),
    },
  ]);

  return buildDefaultDependencies({
    now: clock.now,
    quizDefinitionSource,
  });
}

function buildPlannedAnswers(params: {
  readonly players: readonly SimulationPlayer[];
  readonly question: SimulatedQuestion;
  readonly roundStartMs: number;
  readonly roundDurationMs: number;
  readonly lateWindowMs: number;
  readonly random: () => number;
}): PlannedAnswer[] {
  const roundCloseMs = params.roundStartMs + params.roundDurationMs;

  return params.players
    .map((player) => {
      const withinRound = params.random() < 0.75;
      const answerOffsetMs = withinRound
        ? randomIntInRange(params.random, 0, params.roundDurationMs)
        : params.roundDurationMs +
          randomIntInRange(params.random, 1, params.lateWindowMs);

      return {
        player,
        submittedAtMs: params.roundStartMs + answerOffsetMs,
        answer: chooseRandomAnswer(params.question, params.random),
        withinRound: params.roundStartMs + answerOffsetMs <= roundCloseMs,
      } satisfies PlannedAnswer;
    })
    .sort((left, right) => left.submittedAtMs - right.submittedAtMs);
}

function chooseRandomAnswer(
  question: SimulatedQuestion,
  random: () => number,
): string {
  const chooseCorrectAnswer = random() < 0.35;

  if (chooseCorrectAnswer) {
    return question.acceptedAnswer;
  }

  const wrongAnswers = question.answerPool.filter(
    (candidate) => candidate !== question.acceptedAnswer,
  );

  return wrongAnswers[randomIntInRange(random, 0, wrongAnswers.length - 1)]!;
}

function assertSessionJoin(
  event: OutboundEventEnvelope,
  expectedDisplayName: string,
  expectedParticipantCount: number,
): TransportSessionView {
  assert.equal(event.event, "session.joined");

  const payload = event.payload as TransportSessionView;

  assert.equal(payload.session.quizId, QUIZ_ID);
  assert.equal(payload.session.currentQuestionId, "question-1");
  assert.equal(payload.participants.length, expectedParticipantCount);
  assert.equal(payload.self.displayName, expectedDisplayName);

  return payload;
}

function assertRejectedAnswer(event: OutboundEventEnvelope): CommandRejectedPayload {
  assert.equal(event.event, "command.rejected");

  const payload = event.payload as CommandRejectedPayload;

  assert.equal(payload.code, "answer_rejected");

  return payload;
}

function assertSnapshotEvents(
  eventGroups: readonly (readonly OutboundEventEnvelope[])[],
  expectedPhase: SessionSnapshot["phase"],
  expectedQuestionId: string | null,
): void {
  for (const events of eventGroups) {
    const event = events[0];

    assert.ok(event);
    assert.equal(event.event, "session.snapshot");

    const payload = event.payload as SessionSnapshotPayload;

    assert.equal(payload.session.phase, expectedPhase);
    assert.equal(payload.session.currentQuestionId, expectedQuestionId);
  }
}

async function requireSnapshot(
  deps: AppDependencies,
): Promise<SessionSnapshot> {
  const snapshot = await deps.sessionService.getSessionSnapshot(QUIZ_ID);

  assert.ok(snapshot);

  return snapshot;
}

function logFocusEvents(
  focusPlayerName: string,
  stageLabel: string,
  eventMap: ReadonlyMap<string, readonly OutboundEventEnvelope[]>,
): void {
  const focusEvents = eventMap.get(focusPlayerName) ?? [];

  if (focusEvents.length === 0) {
    console.log(
      `[simulate:random-game] pov ${focusPlayerName} during ${stageLabel}: no new events`,
    );
    return;
  }

  const summary = focusEvents.map(formatEventSummary).join(", ");

  console.log(
    `[simulate:random-game] pov ${focusPlayerName} during ${stageLabel}: ${summary}`,
  );
}

function extractLeaderboardFromEvents(
  events: readonly OutboundEventEnvelope[],
): LeaderboardUpdatedPayload["leaderboard"] | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event?.event !== "leaderboard.updated") {
      continue;
    }

    return (event.payload as LeaderboardUpdatedPayload).leaderboard;
  }

  return null;
}

function formatEventSummary(event: OutboundEventEnvelope): string {
  if (event.event === "participant.score.updated") {
    const payload = event.payload as ParticipantScoreUpdatedPayload;

    return `score(question=${payload.questionId}, delta=${payload.scoreDelta}, total=${payload.totalScore}, requestId=${event.requestId ?? "fanout"})`;
  }

  if (event.event === "leaderboard.updated") {
    const payload = event.payload as LeaderboardUpdatedPayload;
    const leader = payload.leaderboard[0];

    return `leaderboard(leader=${leader?.displayName ?? "unknown"}, score=${leader?.score ?? 0}, requestId=${event.requestId ?? "fanout"})`;
  }

  if (event.event === "session.snapshot") {
    const payload = event.payload as SessionSnapshotPayload;

    return `snapshot(phase=${payload.session.phase}, currentQuestionId=${payload.session.currentQuestionId ?? "none"})`;
  }

  if (event.event === "command.rejected") {
    const payload = event.payload as CommandRejectedPayload;

    return `rejected(code=${payload.code}, message=${payload.message})`;
  }

  return event.event;
}

function printLeaderboard(
  label: string,
  leaderboard: readonly LeaderboardUpdatedPayload["leaderboard"][number][],
): void {
  const formatted = leaderboard.length
    ? leaderboard
        .map(
          (entry) =>
            `#${entry.rank} ${entry.displayName ?? entry.participantId} (${entry.score})`,
        )
        .join(" | ")
    : "empty";

  console.log(`[simulate:random-game] leaderboard ${label}: ${formatted}`);
}

function formatSeconds(timeMs: number): string {
  return `${(timeMs / 1_000).toFixed(1)}s`;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let next = state;

    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomIntInRange(random: () => number, min: number, max: number): number {
  if (min >= max) {
    return min;
  }

  return min + Math.floor(random() * (max - min + 1));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);

  console.error(`[simulate:random-game] failed: ${message}`);
  process.exitCode = 1;
});
