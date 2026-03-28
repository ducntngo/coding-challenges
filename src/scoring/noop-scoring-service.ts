import type { AnswerSubmission, ScoringResult, ScoringService } from "./contracts";

export class NoopScoringService implements ScoringService {
  async scoreSubmission(_input: AnswerSubmission): Promise<ScoringResult> {
    throw new Error(
      "scoreSubmission is not implemented in the foundation scaffold.",
    );
  }
}

export type { ScoringService } from "./contracts";
