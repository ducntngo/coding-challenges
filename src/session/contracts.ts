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
  readonly version: number;
  readonly participants: readonly ParticipantSummary[];
  readonly leaderboard: readonly LeaderboardEntry[];
}

export interface SessionAggregate {
  readonly snapshot: SessionSnapshot;
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
  readonly participantId: string;
  readonly connectionId: string;
}

export interface QuizSessionService {
  joinSession(input: JoinSessionInput): Promise<SessionSnapshot>;
  reconnectParticipant(input: ReconnectParticipantInput): Promise<SessionSnapshot>;
  disconnectParticipant(input: DisconnectParticipantInput): Promise<void>;
  getSessionSnapshot(quizId: string): Promise<SessionSnapshot | null>;
}
