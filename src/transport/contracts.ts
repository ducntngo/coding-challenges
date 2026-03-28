export const inboundCommands = [
  "session.join",
  "session.reconnect",
  "answer.submit",
] as const;

export type InboundCommandName = (typeof inboundCommands)[number];

/**
 * Transport commands always use an explicit envelope so boundary validation can
 * stay transport-specific while domain services remain unaware of WebSocket
 * framing details.
 */
export interface InboundCommandEnvelope<TPayload = unknown> {
  readonly command: string;
  // requestId is client-supplied correlation metadata, not a deduplication key.
  readonly requestId?: string;
  readonly payload: TPayload;
}

export const outboundEvents = [
  "session.joined",
  "session.reconnected",
  "session.snapshot",
  "participant.presence.updated",
  "participant.score.updated",
  "leaderboard.updated",
  "command.rejected",
] as const;

export type OutboundEventName = (typeof outboundEvents)[number];

/**
 * Outbound events are the only transport-visible payload shape. Direct replies
 * may preserve requestId, but passive fanout intentionally strips it because
 * those recipients did not issue the triggering command.
 */
export interface OutboundEventEnvelope<TPayload = unknown> {
  readonly event: OutboundEventName;
  readonly requestId?: string;
  readonly payload: TPayload;
}

export const transportErrorCodes = [
  "invalid_payload",
  "unknown_command",
  "command_not_allowed",
  "not_bound",
  "join_rejected",
  "reconnect_rejected",
  "answer_rejected",
  "internal_error",
] as const;

export type TransportErrorCode = (typeof transportErrorCodes)[number];

/**
 * Rejections stay transport-level so the gateway can explain invalid or
 * disallowed actions without pretending those outcomes mutated domain state.
 */
export interface CommandRejectedPayload {
  readonly code: TransportErrorCode;
  readonly message: string;
}

/** Payload for the first binding step on a fresh connection. */
export interface SessionJoinPayload {
  readonly quizId: string;
  // displayName is optional and normalized server-side before persistence.
  readonly displayName?: string;
}

/** Payload for reclaiming a session-scoped identity after disconnect. */
export interface SessionReconnectPayload {
  readonly quizId: string;
  readonly reconnectToken: string;
}

/** Payload for an answer against the server's current active question. */
export interface AnswerSubmitPayload {
  readonly questionId: string;
  readonly answer: string;
}

/**
 * Canonical transport-visible session state. `self` contains sensitive
 * per-participant data such as the reconnect token, while `participants`
 * intentionally omits those fields for everyone else in the session.
 */
export interface TransportSessionView {
  readonly session: {
    readonly quizId: string;
    readonly sessionInstanceId: string;
    readonly status: string;
    readonly phase: string;
    readonly currentQuestionId: string | null;
    readonly version: number;
  };
  readonly self: {
    readonly participantId: string;
    readonly displayName: string | null;
    readonly state: string;
    readonly score: number;
    readonly reconnectToken: string;
  };
  readonly participants: readonly {
    readonly participantId: string;
    readonly displayName: string | null;
    readonly state: string;
    readonly score: number;
  }[];
  readonly leaderboard: readonly {
    readonly participantId: string;
    readonly displayName: string | null;
    readonly score: number;
    readonly rank: number;
  }[];
}

/**
 * Narrow update event for the submitting participant. The current transport
 * also emits a leaderboard update so passive recipients can stay in sync.
 */
export interface ParticipantScoreUpdatedPayload {
  readonly quizId: string;
  readonly participantId: string;
  readonly questionId: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
}

/** Ordered leaderboard snapshot after an accepted answer changes ranking state. */
export interface LeaderboardUpdatedPayload {
  readonly quizId: string;
  readonly leaderboard: TransportSessionView["leaderboard"];
}

/** Full-state sync event reused for join, reconnect, and progression fanout. */
export type SessionSnapshotPayload = TransportSessionView;

export function isKnownInboundCommand(
  command: string,
): command is InboundCommandName {
  return (inboundCommands as readonly string[]).includes(command);
}
