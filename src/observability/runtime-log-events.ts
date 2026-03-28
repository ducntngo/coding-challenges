import type { SessionAggregate } from "../session/contracts";
import type {
  CommandRejectedPayload,
  LeaderboardUpdatedPayload,
  OutboundEventEnvelope,
  ParticipantScoreUpdatedPayload,
  TransportSessionView,
} from "../transport/contracts";

export interface InboundCommandSummary {
  readonly command?: string;
  readonly requestId?: string;
}

export interface RuntimeLogEvent {
  readonly level: "info" | "warn";
  readonly message: string;
  readonly fields: Record<string, unknown>;
}

export function extractInboundCommandSummary(
  rawMessage: string,
): InboundCommandSummary {
  try {
    const candidate = JSON.parse(rawMessage) as Record<string, unknown>;

    return {
      ...(typeof candidate.command === "string"
        ? { command: candidate.command }
        : {}),
      ...(typeof candidate.requestId === "string"
        ? { requestId: candidate.requestId }
        : {}),
    };
  } catch {
    return {};
  }
}

export function buildTransportRuntimeLogEvents(params: {
  readonly connectionId: string;
  readonly quizId?: string;
  readonly participantId?: string;
  readonly inbound: InboundCommandSummary;
  readonly events: readonly OutboundEventEnvelope[];
}): readonly RuntimeLogEvent[] {
  const logs: RuntimeLogEvent[] = [];

  for (const event of params.events) {
    if (event.event === "session.joined") {
      const payload = event.payload as TransportSessionView;

      logs.push({
        level: "info",
        message: "participant joined",
        fields: {
          connectionId: params.connectionId,
          command: params.inbound.command ?? "session.join",
          requestId: event.requestId ?? params.inbound.requestId,
          quizId: payload.session.quizId,
          sessionInstanceId: payload.session.sessionInstanceId,
          participantId: payload.self.participantId,
          participantCount: payload.participants.length,
        },
      });
      continue;
    }

    if (event.event === "session.reconnected") {
      const payload = event.payload as TransportSessionView;

      logs.push({
        level: "info",
        message: "participant reconnected",
        fields: {
          connectionId: params.connectionId,
          command: params.inbound.command ?? "session.reconnect",
          requestId: event.requestId ?? params.inbound.requestId,
          quizId: payload.session.quizId,
          sessionInstanceId: payload.session.sessionInstanceId,
          participantId: payload.self.participantId,
          participantState: payload.self.state,
        },
      });
      continue;
    }

    if (event.event === "command.rejected") {
      const payload = event.payload as CommandRejectedPayload;

      logs.push({
        level: "warn",
        message: "transport command rejected",
        fields: {
          connectionId: params.connectionId,
          command: params.inbound.command,
          requestId: event.requestId ?? params.inbound.requestId,
          quizId: params.quizId,
          participantId: params.participantId,
          rejectionCode: payload.code,
          rejectionMessage: payload.message,
        },
      });
      continue;
    }

    if (event.event === "participant.score.updated") {
      const payload = event.payload as ParticipantScoreUpdatedPayload;

      logs.push({
        level: "info",
        message: "answer accepted",
        fields: {
          connectionId: params.connectionId,
          command: params.inbound.command ?? "answer.submit",
          requestId: event.requestId ?? params.inbound.requestId,
          quizId: payload.quizId,
          participantId: payload.participantId,
          questionId: payload.questionId,
          scoreDelta: payload.scoreDelta,
          totalScore: payload.totalScore,
        },
      });
      continue;
    }

    if (event.event === "leaderboard.updated") {
      const payload = event.payload as LeaderboardUpdatedPayload;
      const leader = payload.leaderboard[0];

      logs.push({
        level: "info",
        message: "leaderboard updated",
        fields: {
          connectionId: params.connectionId,
          command: params.inbound.command ?? "answer.submit",
          requestId: event.requestId ?? params.inbound.requestId,
          quizId: payload.quizId,
          leaderboardSize: payload.leaderboard.length,
          topParticipantId: leader?.participantId ?? null,
          topScore: leader?.score ?? null,
        },
      });
    }
  }

  return logs;
}

export function buildProgressionDispatchLogEvent(params: {
  readonly session: SessionAggregate;
  readonly recipientCount: number;
}): RuntimeLogEvent {
  return {
    level: "info",
    message: "session snapshot dispatched",
    fields: {
      quizId: params.session.snapshot.quizId,
      sessionInstanceId: params.session.snapshot.sessionInstanceId,
      phase: params.session.snapshot.phase,
      currentQuestionId: params.session.snapshot.currentQuestionId,
      recipientCount: params.recipientCount,
    },
  };
}
