export const inboundCommands = [
  "session.join",
  "session.reconnect",
  "answer.submit",
] as const;

export type InboundCommandName = (typeof inboundCommands)[number];

export interface InboundCommandEnvelope<TPayload = unknown> {
  readonly command: string;
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

export interface CommandRejectedPayload {
  readonly code: TransportErrorCode;
  readonly message: string;
}

export interface SessionJoinPayload {
  readonly quizId: string;
  readonly displayName?: string;
}

export interface SessionReconnectPayload {
  readonly quizId: string;
  readonly reconnectToken: string;
}

export interface AnswerSubmitPayload {
  readonly questionId: string;
  readonly answer: string;
}

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

export interface ParticipantScoreUpdatedPayload {
  readonly quizId: string;
  readonly participantId: string;
  readonly questionId: string;
  readonly scoreDelta: number;
  readonly totalScore: number;
}

export interface LeaderboardUpdatedPayload {
  readonly quizId: string;
  readonly leaderboard: TransportSessionView["leaderboard"];
}

export function isKnownInboundCommand(
  command: string,
): command is InboundCommandName {
  return (inboundCommands as readonly string[]).includes(command);
}
