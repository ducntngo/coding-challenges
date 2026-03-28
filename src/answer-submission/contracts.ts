import type { LeaderboardEntry } from "../session/contracts";

export interface SubmitAnswerInput {
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: string;
}

export interface AcceptedAnswerResult {
  readonly accepted: true;
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
  readonly leaderboard: readonly LeaderboardEntry[];
}

export interface RejectedAnswerResult {
  readonly accepted: false;
  readonly reason: string;
}

export type AnswerSubmissionResult =
  | AcceptedAnswerResult
  | RejectedAnswerResult;

export interface AnswerSubmissionService {
  submitAnswer(input: SubmitAnswerInput): Promise<AnswerSubmissionResult>;
}
