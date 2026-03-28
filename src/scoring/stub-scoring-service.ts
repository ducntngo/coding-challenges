import type { AnswerSubmission, ScoringResult, ScoringService } from "./contracts";

export class StubScoringService implements ScoringService {
  async scoreSubmission(input: AnswerSubmission): Promise<ScoringResult> {
    const normalizedAnswer = input.answer.trim().toLowerCase();
    const scoreDelta = normalizedAnswer === "correct" ? 100 : 0;

    return {
      accepted: true,
      scoreDelta,
      totalScore: input.currentScore + scoreDelta,
    };
  }
}

export type { ScoringService } from "./contracts";
