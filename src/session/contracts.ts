export type SessionStatus = "active" | "closing" | "closed";
export type SessionPhase =
  | "lobby"
  | "question_open"
  | "question_closed"
  | "finished";
export type ParticipantState = "active" | "disconnected" | "expired";

/** Transport-safe participant shape without reconnect or connection ownership fields. */
export interface ParticipantSummary {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly state: ParticipantState;
  readonly score: number;
}

/**
 * Internal participant state extends the transport-safe summary with reconnect
 * ownership and scoring bookkeeping that should not be exposed to other clients.
 */
export interface ParticipantRecord extends ParticipantSummary {
  readonly reconnectToken: string;
  readonly connectionId?: string;
  // joinOrder is the current deterministic fallback tie-break for ranking.
  readonly joinOrder: number;
  // answeredQuestionIds enforces first-answer-wins without needing a separate table yet.
  readonly answeredQuestionIds: readonly string[];
}

/** Ordered ranking entry included in snapshots and leaderboard updates. */
export interface LeaderboardEntry {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly score: number;
  readonly rank: number;
}

/** Authoritative client-visible session state at a point in time. */
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

/**
 * Server-side session state combines the transport-visible snapshot with
 * additional fields needed for scoring and reconnect handling.
 */
export interface SessionAggregate {
  readonly snapshot: SessionSnapshot;
  readonly participantRecords: readonly ParticipantRecord[];
  // This timestamp stays internal so scoring can use server-observed timing only.
  readonly currentQuestionOpenedAtMs: number | null;
}

/** Session binding data returned only to the participant that owns the connection. */
export interface SessionBinding {
  readonly participantId: string;
  readonly displayName: string | null;
  readonly state: ParticipantState;
  readonly score: number;
  readonly reconnectToken: string;
}

/** Successful bind result always carries the latest authoritative snapshot. */
export interface SessionBindingResult {
  readonly snapshot: SessionSnapshot;
  readonly self: SessionBinding;
}

/** Input for creating or joining the active live session for a quiz. */
export interface JoinSessionInput {
  readonly quizId: string;
  readonly displayName?: string;
  // connectionId is transport-owned and lets disconnect handling reject stale sockets later.
  readonly connectionId: string;
}

/** Input for reclaiming a participant identity after reconnect. */
export interface ReconnectParticipantInput {
  readonly quizId: string;
  readonly reconnectToken: string;
  readonly connectionId: string;
}

/** Disconnects are matched against the owning connection to avoid stale evictions. */
export interface DisconnectParticipantInput {
  readonly quizId: string;
  readonly participantId: string;
  readonly connectionId: string;
}

/** Session lifecycle boundary used by transport and answer orchestration. */
export interface QuizSessionService {
  joinSession(input: JoinSessionInput): Promise<SessionBindingResult>;
  reconnectParticipant(
    input: ReconnectParticipantInput,
  ): Promise<SessionBindingResult>;
  disconnectParticipant(input: DisconnectParticipantInput): Promise<void>;
  getSessionSnapshot(quizId: string): Promise<SessionSnapshot | null>;
}

/**
 * Internal-only progression boundary. The current runtime uses this from tests
 * and local tooling rather than from a public host-facing transport command.
 */
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
