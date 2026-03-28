import type { QuizSessionService } from "../session/contracts";
import type { ScoringService } from "../scoring/contracts";
import type { ConnectionContext } from "./connection-context";
import {
  isKnownInboundCommand,
  type CommandRejectedPayload,
  type InboundCommandEnvelope,
  type OutboundEventEnvelope,
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
    void this.deps;

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

    return [
      buildRejectedEvent(
        envelope.requestId,
        "internal_error",
        `${envelope.command} is not implemented in the foundation scaffold yet.`,
      ),
    ];
  }

  async handleDisconnect(_ctx: ConnectionContext): Promise<void> {
    return;
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
