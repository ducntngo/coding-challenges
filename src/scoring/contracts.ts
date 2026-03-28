/**
 * Scoring input is already narrowed to a single accepted-answer candidate. The
 * timestamps are server-observed values so the policy never depends on client clocks.
 */
export interface AnswerSubmission {
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: string;
  readonly acceptedAnswer: string;
  readonly questionOpenedAtMs: number;
  readonly receivedAtMs: number;
  // currentScore is passed in so the policy can return the next total directly.
  readonly currentScore: number;
}

/**
 * Scoring may still reject if a future policy decides the submission should not
 * count even after orchestration-level validation. The current stub always accepts.
 */
export interface ScoringResult {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
}

/** Replaceable policy boundary for timing and correctness-based score calculation. */
export interface ScoringService {
  scoreSubmission(input: AnswerSubmission): Promise<ScoringResult>;
}
