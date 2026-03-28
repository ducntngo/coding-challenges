import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../../src/app/dependencies";
import { MockQuizDefinitionSource } from "../../src/quiz-source/mock-quiz-definition-source";
import { StubQuizSessionService } from "../../src/session/stub-quiz-session-service";
import type { SessionProgressionEvent } from "../../src/session/session-progression-events";
import type { SessionAggregate } from "../../src/session/contracts";
import type { SessionStore } from "../../src/store/contracts";

test("session progression advances to the next question and then finishes", async () => {
  const deps = buildDefaultDependencies();

  await deps.sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const advancedSnapshot = await deps.progressionService.advanceToNextQuestion(
    "demo-quiz",
  );

  assert.equal(advancedSnapshot.phase, "question_open");
  assert.equal(advancedSnapshot.currentQuestionId, "question-2");

  const finishedSnapshot = await deps.progressionService.advanceToNextQuestion(
    "demo-quiz",
  );

  assert.equal(finishedSnapshot.phase, "finished");
  assert.equal(finishedSnapshot.currentQuestionId, null);
});

test("session progression publishes snapshot updates for transport subscribers", async (t) => {
  const deps = buildDefaultDependencies();
  const progressionEvents: SessionProgressionEvent[] = [];
  const unsubscribe = deps.sessionProgressionNotifier.subscribe((event) => {
    progressionEvents.push(event);
  });

  t.after(() => {
    unsubscribe();
  });

  await deps.sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  await deps.progressionService.closeCurrentQuestion("demo-quiz");
  await deps.progressionService.advanceToNextQuestion("demo-quiz");

  assert.equal(progressionEvents.length, 2);
  assert.equal(progressionEvents[0]?.session.snapshot.phase, "question_closed");
  assert.equal(
    progressionEvents[0]?.session.snapshot.currentQuestionId,
    "question-1",
  );
  assert.equal(progressionEvents[1]?.session.snapshot.phase, "question_open");
  assert.equal(
    progressionEvents[1]?.session.snapshot.currentQuestionId,
    "question-2",
  );
});

test("session service records question-open time for a new session", async () => {
  const sessionStore = new InMemoryTestSessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      now: () => 1_000,
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-1",
    },
  );

  await sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(session);
  assert.equal(session.currentQuestionOpenedAtMs, 1_000);
});

test("session service refreshes question-open time for the first seeded participant", async () => {
  const sessionStore = new (await import("../../src/store/in-memory-session-store.js")).InMemorySessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      now: () => 1_000,
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-1",
    },
  );

  await sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(session);
  assert.equal(session.currentQuestionOpenedAtMs, 1_000);
});

test("session progression preserves and refreshes question-open time", async () => {
  const sessionStore = new InMemoryTestSessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      now: () => 1_000,
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-1",
    },
  );

  await sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const progressionService = new (await import("../../src/session/stub-session-progression-service.js")).StubSessionProgressionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    undefined,
    () => 2_000,
  );

  await progressionService.closeCurrentQuestion("demo-quiz");

  const closedSession = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(closedSession);
  assert.equal(closedSession.currentQuestionOpenedAtMs, 1_000);

  await progressionService.advanceToNextQuestion("demo-quiz");

  const advancedSession = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(advancedSession);
  assert.equal(advancedSession.currentQuestionOpenedAtMs, 2_000);

  await progressionService.advanceToNextQuestion("demo-quiz");

  const finishedSession = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(finishedSession);
  assert.equal(finishedSession.currentQuestionOpenedAtMs, null);
});

class InMemoryTestSessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionAggregate>();

  async getActiveSession(quizId: string): Promise<SessionAggregate | null> {
    return this.sessions.get(quizId) ?? null;
  }

  async saveSession(session: SessionAggregate): Promise<void> {
    this.sessions.set(session.snapshot.quizId, session);
  }
}
