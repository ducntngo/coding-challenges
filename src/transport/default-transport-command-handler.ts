import type { QuizSessionService } from "../session/contracts";
import { SessionJoinRejectedError } from "../session/contracts";
import { SessionReconnectRejectedError } from "../session/contracts";
import type { ScoringService } from "../scoring/contracts";
import type { ConnectionContext } from "./connection-context";
import {
  isKnownInboundCommand,
  type CommandRejectedPayload,
  type InboundCommandEnvelope,
  type OutboundEventEnvelope,
  type SessionJoinPayload,
  type SessionReconnectPayload,
  type TransportSessionView,
  type TransportErrorCode,
} from "./contracts";
import type { TransportCommandHandler } from "./transport-command-handler";

export interface TransportHandlerDependencies {
  readonly sessionService: QuizSessionService;
  readonly scoringService: ScoringService;
}

export class DefaultTransportCommandHandler implements TransportCommandHandler {
  constructor(private readonly deps: TransportHandlerDependencies) {}

  async handleMessage(
    ctx: ConnectionContext,
    rawMessage: string,
  ): Promise<OutboundEventEnvelope[]> {
    const parsed = parseInboundEnvelope(rawMessage);

    if (!parsed.ok) {
      return [buildRejectedEvent(undefined, "invalid_payload", parsed.message)];
    }

    const envelope = parsed.envelope;

    if (!isKnownInboundCommand(envelope.command)) {
      return [
        buildRejectedEvent(
          envelope.requestId,
          "unknown_command",
          `Unknown command: ${envelope.command}`,
        ),
      ];
    }

    if (ctx.state === "awaiting_bind" && envelope.command === "answer.submit") {
      return [
        buildRejectedEvent(
          envelope.requestId,
          "not_bound",
          "answer.submit requires a bound participant connection.",
        ),
      ];
    }

    if (
      ctx.state === "bound" &&
      (envelope.command === "session.join" ||
        envelope.command === "session.reconnect")
    ) {
      return [
        buildRejectedEvent(
          envelope.requestId,
          "command_not_allowed",
          `${envelope.command} is only allowed before a connection is bound.`,
        ),
      ];
    }

    if (envelope.command === "session.join") {
      const payload = validateSessionJoinPayload(envelope.payload);

      if (!payload.ok) {
        return [
          buildRejectedEvent(envelope.requestId, "invalid_payload", payload.message),
        ];
      }

      try {
        const result = await this.deps.sessionService.joinSession({
          quizId: payload.value.quizId,
          ...(payload.value.displayName !== undefined
            ? { displayName: payload.value.displayName }
            : {}),
          connectionId: ctx.connectionId,
        });

        ctx.state = "bound";
        ctx.quizId = result.snapshot.quizId;
        ctx.participantId = result.self.participantId;

        return [
          {
            event: "session.joined",
            ...(envelope.requestId ? { requestId: envelope.requestId } : {}),
            payload: buildTransportSessionView(result),
          },
        ];
      } catch (error) {
        if (error instanceof SessionJoinRejectedError) {
          return [
            buildRejectedEvent(
              envelope.requestId,
              "join_rejected",
              error.message,
            ),
          ];
        }

        throw error;
      }
    }

    if (envelope.command === "session.reconnect") {
      const payload = validateSessionReconnectPayload(envelope.payload);

      if (!payload.ok) {
        return [
          buildRejectedEvent(envelope.requestId, "invalid_payload", payload.message),
        ];
      }

      try {
        const result = await this.deps.sessionService.reconnectParticipant({
          quizId: payload.value.quizId,
          reconnectToken: payload.value.reconnectToken,
          connectionId: ctx.connectionId,
        });

        ctx.state = "bound";
        ctx.quizId = result.snapshot.quizId;
        ctx.participantId = result.self.participantId;

        return [
          {
            event: "session.reconnected",
            ...(envelope.requestId ? { requestId: envelope.requestId } : {}),
            payload: buildTransportSessionView(result),
          },
        ];
      } catch (error) {
        if (error instanceof SessionReconnectRejectedError) {
          return [
            buildRejectedEvent(
              envelope.requestId,
              "reconnect_rejected",
              error.message,
            ),
          ];
        }

        throw error;
      }
    }

    return [
      buildRejectedEvent(
        envelope.requestId,
        "internal_error",
        `${envelope.command} is not implemented in the foundation scaffold yet.`,
      ),
    ];
  }

  async handleDisconnect(_ctx: ConnectionContext): Promise<void> {
    if (
      _ctx.state !== "bound" ||
      _ctx.quizId === undefined ||
      _ctx.participantId === undefined
    ) {
      return;
    }

    try {
      await this.deps.sessionService.disconnectParticipant({
        quizId: _ctx.quizId,
        participantId: _ctx.participantId,
        connectionId: _ctx.connectionId,
      });
    } finally {
      _ctx.state = "awaiting_bind";
      delete _ctx.quizId;
      delete _ctx.participantId;
    }
  }
}

function parseInboundEnvelope(
  rawMessage: string,
):
  | { ok: true; envelope: InboundCommandEnvelope }
  | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    return {
      ok: false,
      message: "Expected a valid JSON command envelope.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      message: "Command envelope must be a JSON object.",
    };
  }

  const candidate = parsed as Record<string, unknown>;

  if (typeof candidate.command !== "string") {
    return {
      ok: false,
      message: "Command envelope must include a string command field.",
    };
  }

  if (!("payload" in candidate)) {
    return {
      ok: false,
      message: "Command envelope must include a payload field.",
    };
  }

  if (
    "requestId" in candidate &&
    candidate.requestId !== undefined &&
    typeof candidate.requestId !== "string"
  ) {
    return {
      ok: false,
      message: "requestId must be a string when it is provided.",
    };
  }

  return {
    ok: true,
    envelope: {
      command: candidate.command,
      ...(typeof candidate.requestId === "string"
        ? { requestId: candidate.requestId }
        : {}),
      payload: candidate.payload,
    },
  };
}

function validateSessionJoinPayload(
  payload: unknown,
):
  | { ok: true; value: SessionJoinPayload }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      message: "session.join payload must be a JSON object.",
    };
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.quizId !== "string" || candidate.quizId.trim() === "") {
    return {
      ok: false,
      message: "session.join payload must include a non-empty quizId.",
    };
  }

  if (
    "displayName" in candidate &&
    candidate.displayName !== undefined &&
    typeof candidate.displayName !== "string"
  ) {
    return {
      ok: false,
      message: "displayName must be a string when it is provided.",
    };
  }

  if (
    typeof candidate.displayName === "string" &&
    candidate.displayName.trim().length > 40
  ) {
    return {
      ok: false,
      message: "displayName must be 40 characters or fewer.",
    };
  }

  return {
    ok: true,
    value: {
      quizId: candidate.quizId.trim(),
      ...(typeof candidate.displayName === "string"
        ? { displayName: candidate.displayName }
        : {}),
    },
  };
}

function validateSessionReconnectPayload(
  payload: unknown,
):
  | { ok: true; value: SessionReconnectPayload }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      message: "session.reconnect payload must be a JSON object.",
    };
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.quizId !== "string" || candidate.quizId.trim() === "") {
    return {
      ok: false,
      message: "session.reconnect payload must include a non-empty quizId.",
    };
  }

  if (
    typeof candidate.reconnectToken !== "string" ||
    candidate.reconnectToken.trim() === ""
  ) {
    return {
      ok: false,
      message:
        "session.reconnect payload must include a non-empty reconnectToken.",
    };
  }

  return {
    ok: true,
    value: {
      quizId: candidate.quizId.trim(),
      reconnectToken: candidate.reconnectToken.trim(),
    },
  };
}

function buildTransportSessionView(
  result: Awaited<ReturnType<QuizSessionService["joinSession"]>>,
): TransportSessionView {
  return {
    session: {
      quizId: result.snapshot.quizId,
      sessionInstanceId: result.snapshot.sessionInstanceId,
      status: result.snapshot.status,
      phase: result.snapshot.phase,
      version: result.snapshot.version,
    },
    self: {
      participantId: result.self.participantId,
      displayName: result.self.displayName,
      state: result.self.state,
      score: result.self.score,
      reconnectToken: result.self.reconnectToken,
    },
    participants: result.snapshot.participants,
    leaderboard: result.snapshot.leaderboard,
  };
}

function buildRejectedEvent(
  requestId: string | undefined,
  code: TransportErrorCode,
  message: string,
): OutboundEventEnvelope<CommandRejectedPayload> {
  return {
    event: "command.rejected",
    ...(requestId ? { requestId } : {}),
    payload: {
      code,
      message,
    },
  };
}
