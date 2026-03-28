export type SessionStatus = "active" | "closing" | "closed";
export type SessionPhase =
  | "lobby"
  | "question_open"
  | "question_closed"
  | "finished";
export type ParticipantState = "active" | "disconnected" | "expired";

export interface ParticipantSummary {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly state: ParticipantState;
  readonly score: number;
}

export interface ParticipantRecord extends ParticipantSummary {
  readonly reconnectToken: string;
  readonly connectionId?: string;
  readonly joinOrder: number;
  readonly answeredQuestionIds: readonly string[];
}

export interface LeaderboardEntry {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly score: number;
  readonly rank: number;
}

export interface SessionSnapshot {
  readonly quizId: string;
  readonly sessionInstanceId: string;
  readonly status: SessionStatus;
  readonly phase: SessionPhase;
  readonly currentQuestionId: string | null;
  readonly version: number;
  readonly participants: readonly ParticipantSummary[];
  readonly leaderboard: readonly LeaderboardEntry[];
}

export interface SessionAggregate {
  readonly snapshot: SessionSnapshot;
  readonly participantRecords: readonly ParticipantRecord[];
}

export interface SessionBinding {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly state: ParticipantState;
  readonly score: number;
  readonly reconnectToken: string;
}

export interface SessionBindingResult {
  readonly snapshot: SessionSnapshot;
  readonly self: SessionBinding;
}

export interface JoinSessionInput {
  readonly quizId: string;
  readonly displayName?: string;
  readonly connectionId: string;
}

export interface ReconnectParticipantInput {
  readonly quizId: string;
  readonly reconnectToken: string;
  readonly connectionId: string;
}

export interface DisconnectParticipantInput {
  readonly quizId: string;
  readonly participantId: string;
  readonly connectionId: string;
}

export interface QuizSessionService {
  joinSession(input: JoinSessionInput): Promise<SessionBindingResult>;
  reconnectParticipant(
    input: ReconnectParticipantInput,
  ): Promise<SessionBindingResult>;
  disconnectParticipant(input: DisconnectParticipantInput): Promise<void>;
  getSessionSnapshot(quizId: string): Promise<SessionSnapshot | null>;
}

export interface SessionProgressionService {
  closeCurrentQuestion(quizId: string): Promise<SessionSnapshot>;
  advanceToNextQuestion(quizId: string): Promise<SessionSnapshot>;
}

export class SessionJoinRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionJoinRejectedError";
  }
}

export class SessionReconnectRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionReconnectRejectedError";
  }
}

export class SessionProgressionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionProgressionRejectedError";
  }
}
