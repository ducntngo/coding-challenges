import type { LeaderboardEntry } from "../session/contracts";

/** Input required to judge one participant's answer against the current session state. */
export interface SubmitAnswerInput {
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: string;
}

/**
 * Accepted answers may still score zero for an incorrect response. "accepted"
 * means the submission was valid for the active question and mutated session state.
 */
export interface AcceptedAnswerResult {
  readonly accepted: true;
  readonly participantId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
  readonly leaderboard: readonly LeaderboardEntry[];
}

/** Rejected answers never mutate session state or fan out to passive participants. */
export interface RejectedAnswerResult {
  readonly accepted: false;
  readonly reason: string;
}

export type AnswerSubmissionResult =
  | AcceptedAnswerResult
  | RejectedAnswerResult;

/** Answer orchestration boundary used by transport after bind-state validation. */
export interface AnswerSubmissionService {
  submitAnswer(input: SubmitAnswerInput): Promise<AnswerSubmissionResult>;
}
