import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../../src/app/dependencies";

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
