import type { AnswerSubmission, ScoringResult, ScoringService } from "./contracts";

// Challenge-sized defaults: quick full-score window, then linear decay to a non-zero floor.
const MAX_SCORE = 100;
const MIN_CORRECT_SCORE = 10;
const FAST_ANSWER_GRACE_MS = 5_000;
const LINEAR_DECAY_WINDOW_MS = 25_000;

export class StubScoringService implements ScoringService {
  async scoreSubmission(input: AnswerSubmission): Promise<ScoringResult> {
    const normalizedAnswer = normalizeAnswer(input.answer);
    const normalizedAcceptedAnswer = normalizeAnswer(input.acceptedAnswer);
    const scoreDelta =
      normalizedAnswer === normalizedAcceptedAnswer
        ? calculateLinearScore(input.questionOpenedAtMs, input.receivedAtMs)
        : 0;

    return {
      accepted: true,
      scoreDelta,
      totalScore: input.currentScore + scoreDelta,
    };
  }
}

export type { ScoringService } from "./contracts";

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

// Uses only server-observed timestamps so score ordering does not depend on client clocks.
function calculateLinearScore(
  questionOpenedAtMs: number,
  receivedAtMs: number,
): number {
  const elapsedMs = Math.max(0, receivedAtMs - questionOpenedAtMs);

  if (elapsedMs <= FAST_ANSWER_GRACE_MS) {
    return MAX_SCORE;
  }

  const decayedElapsedMs = Math.min(
    elapsedMs - FAST_ANSWER_GRACE_MS,
    LINEAR_DECAY_WINDOW_MS,
  );
  const scoreRange = MAX_SCORE - MIN_CORRECT_SCORE;
  const decayRatio = decayedElapsedMs / LINEAR_DECAY_WINDOW_MS;

  return Math.max(
    MIN_CORRECT_SCORE,
    Math.round(MAX_SCORE - scoreRange * decayRatio),
  );
}
