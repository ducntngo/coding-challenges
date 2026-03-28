import type { AnswerSubmission, ScoringResult, ScoringService } from "./contracts";

export class StubScoringService implements ScoringService {
  async scoreSubmission(input: AnswerSubmission): Promise<ScoringResult> {
    const normalizedAnswer = normalizeAnswer(input.answer);
    const normalizedAcceptedAnswer = normalizeAnswer(input.acceptedAnswer);
    const scoreDelta = normalizedAnswer === normalizedAcceptedAnswer ? 100 : 0;

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
