import assert from "node:assert/strict";

import type {
  LeaderboardUpdatedPayload,
  OutboundEventEnvelope,
  ParticipantScoreUpdatedPayload,
  SessionJoinPayload,
  TransportSessionView,
} from "../src/transport/contracts";
import { SimulationClient } from "./support/simulation-client";

const DEFAULT_WS_URL = "ws://127.0.0.1:3000/ws";
const DEFAULT_TIMEOUT_MS = 3_000;

async function main(): Promise<void> {
  const wsUrl = process.env.QUIZ_SERVICE_WS_URL ?? DEFAULT_WS_URL;
  const timeoutMs = parseTimeoutMs(
    process.env.SIMULATE_GAME_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const alice = await SimulationClient.connect(wsUrl, timeoutMs);
  const bob = await SimulationClient.connect(wsUrl, timeoutMs);
  const carol = await SimulationClient.connect(wsUrl, timeoutMs);

  console.log(`[simulate:game] connected to ${wsUrl}`);

  try {
    const aliceJoinEvent = await alice.sendCommand<SessionJoinPayload>({
      command: "session.join",
      requestId: "req-join-alice",
      payload: {
        quizId: "demo-quiz",
        displayName: "Alice",
      },
    });
    const aliceJoinPayload = assertSessionEvent(
      aliceJoinEvent,
      "session.joined",
      "demo-quiz",
      1,
      "Alice",
    );

    const bobJoinEvent = await bob.sendCommand<SessionJoinPayload>({
      command: "session.join",
      requestId: "req-join-bob",
      payload: {
        quizId: "demo-quiz",
        displayName: "Bob",
      },
    });
    const bobJoinPayload = assertSessionEvent(
      bobJoinEvent,
      "session.joined",
      "demo-quiz",
      2,
      "Bob",
    );

    assert.equal(
      aliceJoinPayload.session.sessionInstanceId,
      bobJoinPayload.session.sessionInstanceId,
    );
    assert.deepEqual(
      bobJoinPayload.participants.map((participant) => participant.displayName).sort(),
      ["Alice", "Bob"],
    );

    const carolJoinEvent = await carol.sendCommand<SessionJoinPayload>({
      command: "session.join",
      requestId: "req-join-carol",
      payload: {
        quizId: "demo-quiz",
        displayName: "Carol",
      },
    });
    const carolJoinPayload = assertSessionEvent(
      carolJoinEvent,
      "session.joined",
      "demo-quiz",
      3,
      "Carol",
    );

    assert.equal(
      aliceJoinPayload.session.sessionInstanceId,
      carolJoinPayload.session.sessionInstanceId,
    );
    assert.deepEqual(
      carolJoinPayload.participants
        .map((participant) => participant.displayName)
        .sort(),
      ["Alice", "Bob", "Carol"],
    );

    console.log("[simulate:game] Alice, Bob, and Carol joined demo-quiz");

    const [aliceAnswerEvents, bobFanoutEvents, carolFanoutEvents] =
      await Promise.all([
      alice.sendCommandAndReadEvents(
        {
          command: "answer.submit",
          requestId: "req-answer-alice",
          payload: {
            questionId: "question-1",
            answer: "correct",
          },
        },
        2,
      ),
      bob.readEvents(2),
      carol.readEvents(2),
    ]);
    const [
      aliceScoreEnvelope,
      aliceLeaderboardEnvelope,
    ] = aliceAnswerEvents;
    const [bobScoreEnvelope, bobLeaderboardEnvelope] = bobFanoutEvents;
    const [carolScoreEnvelope, carolLeaderboardEnvelope] = carolFanoutEvents;

    assert.ok(aliceScoreEnvelope);
    assert.ok(aliceLeaderboardEnvelope);
    assert.ok(bobScoreEnvelope);
    assert.ok(bobLeaderboardEnvelope);
    assert.ok(carolScoreEnvelope);
    assert.ok(carolLeaderboardEnvelope);

    const aliceScoreEvent = assertScoreEvent(
      aliceScoreEnvelope,
      "req-answer-alice",
      aliceJoinPayload.self.participantId,
      "demo-quiz",
    );
    const aliceLeaderboardEvent = assertLeaderboardEvent(
      aliceLeaderboardEnvelope,
      "req-answer-alice",
      "demo-quiz",
    );
    const bobScoreEvent = assertScoreEvent(
      bobScoreEnvelope,
      undefined,
      aliceJoinPayload.self.participantId,
      "demo-quiz",
    );
    const bobLeaderboardEvent = assertLeaderboardEvent(
      bobLeaderboardEnvelope,
      undefined,
      "demo-quiz",
    );
    const carolScoreEvent = assertScoreEvent(
      carolScoreEnvelope,
      undefined,
      aliceJoinPayload.self.participantId,
      "demo-quiz",
    );
    const carolLeaderboardEvent = assertLeaderboardEvent(
      carolLeaderboardEnvelope,
      undefined,
      "demo-quiz",
    );

    assert.equal(aliceScoreEvent.scoreDelta, aliceScoreEvent.totalScore);
    assert.equal(bobScoreEvent.scoreDelta, aliceScoreEvent.scoreDelta);
    assert.equal(bobScoreEvent.totalScore, aliceScoreEvent.totalScore);
    assert.equal(carolScoreEvent.scoreDelta, aliceScoreEvent.scoreDelta);
    assert.equal(carolScoreEvent.totalScore, aliceScoreEvent.totalScore);
    assert.ok(aliceScoreEvent.scoreDelta >= 10);
    assert.ok(aliceScoreEvent.scoreDelta <= 100);

    assert.equal(
      aliceLeaderboardEvent.leaderboard[0]?.participantId,
      aliceJoinPayload.self.participantId,
    );
    assert.equal(
      aliceLeaderboardEvent.leaderboard[0]?.score,
      aliceScoreEvent.totalScore,
    );
    assert.deepEqual(
      aliceLeaderboardEvent.leaderboard,
      bobLeaderboardEvent.leaderboard,
    );
    assert.deepEqual(
      aliceLeaderboardEvent.leaderboard,
      carolLeaderboardEvent.leaderboard,
    );

    logObservedEvents("Alice", [
      aliceScoreEnvelope,
      aliceLeaderboardEnvelope,
    ]);
    logObservedEvents("Bob", [bobScoreEnvelope, bobLeaderboardEnvelope]);
    logObservedEvents("Carol", [
      carolScoreEnvelope,
      carolLeaderboardEnvelope,
    ]);

    console.log(
      `[simulate:game] Alice answered question-1 and reached ${aliceScoreEvent.totalScore} points`,
    );
    console.log(
      "[simulate:game] Bob and Carol received the same score and leaderboard updates through passive fanout",
    );
    console.log("[simulate:game] scenario completed successfully");
  } finally {
    await Promise.allSettled([alice.close(), bob.close(), carol.close()]);
  }
}

function assertSessionEvent(
  event: OutboundEventEnvelope,
  expectedEventName: "session.joined" | "session.reconnected",
  expectedQuizId: string,
  expectedParticipantCount: number,
  expectedDisplayName: string,
): TransportSessionView {
  assert.equal(event.event, expectedEventName);

  const payload = event.payload as TransportSessionView;

  assert.equal(payload.session.quizId, expectedQuizId);
  assert.equal(payload.session.currentQuestionId, "question-1");
  assert.equal(payload.participants.length, expectedParticipantCount);
  assert.equal(payload.self.displayName, expectedDisplayName);

  return payload;
}

function assertScoreEvent(
  event: OutboundEventEnvelope,
  expectedRequestId: string | undefined,
  expectedParticipantId: string,
  expectedQuizId: string,
): ParticipantScoreUpdatedPayload {
  assert.equal(event.event, "participant.score.updated");
  assert.equal(event.requestId, expectedRequestId);

  const payload = event.payload as ParticipantScoreUpdatedPayload;

  assert.equal(payload.quizId, expectedQuizId);
  assert.equal(payload.participantId, expectedParticipantId);
  assert.equal(payload.questionId, "question-1");

  return payload;
}

function assertLeaderboardEvent(
  event: OutboundEventEnvelope,
  expectedRequestId: string | undefined,
  expectedQuizId: string,
): LeaderboardUpdatedPayload {
  assert.equal(event.event, "leaderboard.updated");
  assert.equal(event.requestId, expectedRequestId);

  const payload = event.payload as LeaderboardUpdatedPayload;

  assert.equal(payload.quizId, expectedQuizId);

  return payload;
}

function parseTimeoutMs(
  rawTimeoutMs: string | undefined,
  fallback: number,
): number {
  if (!rawTimeoutMs) {
    return fallback;
  }

  const parsedTimeoutMs = Number.parseInt(rawTimeoutMs, 10);

  if (!Number.isFinite(parsedTimeoutMs) || parsedTimeoutMs <= 0) {
    return fallback;
  }

  return parsedTimeoutMs;
}

function logObservedEvents(
  playerName: string,
  events: readonly OutboundEventEnvelope[],
): void {
  const summary = events
    .map((event) => formatEventSummary(event))
    .join(", ");

  console.log(`[simulate:game] ${playerName} saw ${summary}`);
}

function formatEventSummary(event: OutboundEventEnvelope): string {
  if (event.event === "participant.score.updated") {
    const payload = event.payload as ParticipantScoreUpdatedPayload;

    return `${event.event}(scoreDelta=${payload.scoreDelta}, totalScore=${payload.totalScore}, requestId=${event.requestId ?? "fanout"})`;
  }

  if (event.event === "leaderboard.updated") {
    const payload = event.payload as LeaderboardUpdatedPayload;
    const leader = payload.leaderboard[0];

    return `${event.event}(leader=${leader?.displayName ?? "unknown"}, requestId=${event.requestId ?? "fanout"})`;
  }

  return `${event.event}(requestId=${event.requestId ?? "fanout"})`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);

  console.error(`[simulate:game] failed: ${message}`);
  process.exitCode = 1;
});
