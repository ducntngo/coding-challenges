import assert from "node:assert/strict";
import test from "node:test";

import { StubScoringService } from "../../src/scoring/stub-scoring-service";

test("stub scoring service accepts a correct answer from quiz data", async () => {
  const scoringService = new StubScoringService();

  const result = await scoringService.scoreSubmission({
    participantId: "participant-1",
    quizId: "demo-quiz",
    questionId: "question-1",
    answer: "  PaRiS ",
    acceptedAnswer: "paris",
    currentScore: 25,
  });

  assert.deepEqual(result, {
    accepted: true,
    scoreDelta: 100,
    totalScore: 125,
  });
});

test("stub scoring service returns zero for an incorrect answer from quiz data", async () => {
  const scoringService = new StubScoringService();

  const result = await scoringService.scoreSubmission({
    participantId: "participant-1",
    quizId: "demo-quiz",
    questionId: "question-1",
    answer: "london",
    acceptedAnswer: "paris",
    currentScore: 25,
  });

  assert.deepEqual(result, {
    accepted: true,
    scoreDelta: 0,
    totalScore: 25,
  });
});
