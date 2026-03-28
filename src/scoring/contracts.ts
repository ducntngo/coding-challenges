export interface AnswerSubmission {
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: string;
}

export interface ScoringResult {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
}

export interface ScoringService {
  scoreSubmission(input: AnswerSubmission): Promise<ScoringResult>;
}
