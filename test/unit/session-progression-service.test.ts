import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../../src/app/dependencies";
import type { SessionProgressionEvent } from "../../src/session/session-progression-events";

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
