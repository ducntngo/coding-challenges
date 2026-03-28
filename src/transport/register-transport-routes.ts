import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import WebSocket, { type RawData } from "ws";

import {
  buildProgressionDispatchLogEvent,
  buildTransportRuntimeLogEvents,
  extractInboundCommandSummary,
} from "../observability/runtime-log-events";
import type { SessionAggregate } from "../session/contracts";
import type { SessionProgressionNotifier } from "../session/session-progression-events";
import type { ConnectionContext } from "./connection-context";
import type {
  OutboundEventEnvelope,
  SessionSnapshotPayload,
} from "./contracts";
import { buildTransportSessionViewFromSession } from "./session-view";
import { SessionConnectionRegistry } from "./session-connection-registry";
import type { TransportCommandHandler } from "./transport-command-handler";

export interface TransportRouteDependencies {
  readonly transportCommandHandler: TransportCommandHandler;
  readonly sessionProgressionNotifier: SessionProgressionNotifier;
}

/**
 * Wires the process-local WebSocket boundary to the transport command handler
 * and the session fanout registry. In the challenge runtime, all live delivery
 * happens inside this one process.
 */
export function registerTransportRoutes(
  app: FastifyInstance,
  deps: TransportRouteDependencies,
): void {
  // This registry intentionally lives at the route layer because transport owns sockets.
  const connectionRegistry = new SessionConnectionRegistry();
  const unsubscribeFromProgressionUpdates =
    deps.sessionProgressionNotifier.subscribe((event) => {
      try {
        const recipientCount = dispatchProgressionSnapshot(
          connectionRegistry,
          event.session,
        );
        const logEvent = buildProgressionDispatchLogEvent({
          session: event.session,
          recipientCount,
        });

        app.log.info(logEvent.fields, logEvent.message);
      } catch (error) {
        app.log.error(
          {
            err: error,
            quizId: event.session.snapshot.quizId,
            sessionInstanceId: event.session.snapshot.sessionInstanceId,
          },
          "progression snapshot dispatch failed",
        );
      }
    });

  app.addHook("onClose", async () => {
    unsubscribeFromProgressionUpdates();
  });

  app.get("/ws", { websocket: true }, (socket: WebSocket) => {
    const ctx: ConnectionContext = {
      connectionId: randomUUID(),
      state: "awaiting_bind",
    };
    const sendToSocket = (event: OutboundEventEnvelope): void => {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(JSON.stringify(event));
    };

    socket.on("message", async (buffer: RawData) => {
      const rawMessage =
        typeof buffer === "string" ? buffer : buffer.toString("utf8");
      const inbound = extractInboundCommandSummary(rawMessage);

      try {
        const events = await deps.transportCommandHandler.handleMessage(
          ctx,
          rawMessage,
        );

        registerCurrentConnection(connectionRegistry, ctx, events, sendToSocket);
        const logEvents = buildTransportRuntimeLogEvents({
          connectionId: ctx.connectionId,
          ...(ctx.quizId !== undefined ? { quizId: ctx.quizId } : {}),
          ...(ctx.participantId !== undefined
            ? { participantId: ctx.participantId }
            : {}),
          inbound,
          events,
        });

        for (const logEvent of logEvents) {
          if (logEvent.level === "warn") {
            app.log.warn(logEvent.fields, logEvent.message);
            continue;
          }

          app.log.info(logEvent.fields, logEvent.message);
        }

        dispatchOutboundEvents(connectionRegistry, ctx, events, sendToSocket);
      } catch (error) {
        app.log.error({ err: error, connectionId: ctx.connectionId }, "transport handler failed");
        sendToSocket(
          {
            event: "command.rejected",
            payload: {
              code: "internal_error",
              message: "Unhandled transport error.",
            },
          },
        );
      }
    });

    socket.on("close", () => {
      const disconnectBinding =
        ctx.state === "bound" && ctx.quizId !== undefined && ctx.participantId !== undefined
          ? {
              connectionId: ctx.connectionId,
              quizId: ctx.quizId,
              participantId: ctx.participantId,
            }
          : {
              connectionId: ctx.connectionId,
            };

      void deps.transportCommandHandler.handleDisconnect(ctx).catch((error) => {
        app.log.error(
          {
            err: error,
            connectionId: ctx.connectionId,
            quizId: ctx.quizId,
            participantId: ctx.participantId,
          },
          "transport disconnect handler failed",
        );
      }).finally(() => {
        connectionRegistry.unbindConnection(disconnectBinding);
      });
    });
  });
}

function registerCurrentConnection(
  connectionRegistry: SessionConnectionRegistry,
  ctx: ConnectionContext,
  events: readonly OutboundEventEnvelope[],
  send: (event: OutboundEventEnvelope) => void,
): void {
  if (
    ctx.state !== "bound" ||
    ctx.quizId === undefined ||
    ctx.participantId === undefined
  ) {
    return;
  }

  const acceptedBindEvent = events.some(
    (event) =>
      event.event === "session.joined" || event.event === "session.reconnected",
  );

  if (!acceptedBindEvent) {
    return;
  }

  // A connection only becomes a live fanout recipient after a successful bind event.
  connectionRegistry.bindConnection({
    connectionId: ctx.connectionId,
    quizId: ctx.quizId,
    participantId: ctx.participantId,
    send,
  });
}

function dispatchOutboundEvents(
  connectionRegistry: SessionConnectionRegistry,
  ctx: ConnectionContext,
  events: readonly OutboundEventEnvelope[],
  sendToOrigin: (event: OutboundEventEnvelope) => void,
): void {
  if (
    !shouldFanoutToSession(events) ||
    ctx.state !== "bound" ||
    ctx.quizId === undefined
  ) {
    for (const event of events) {
      sendToOrigin(event);
    }
    return;
  }

  // Fanout is session-scoped and only makes sense once the origin socket is the
  // currently bound owner. Otherwise the safest fallback is origin-only delivery.
  const recipients = connectionRegistry.getSessionConnections(ctx.quizId);

  if (!recipients.some((recipient) => recipient.connectionId === ctx.connectionId)) {
    for (const event of events) {
      sendToOrigin(event);
    }
    return;
  }

  for (const recipient of recipients) {
    const isOriginConnection = recipient.connectionId === ctx.connectionId;

    for (const event of events) {
      recipient.send(
        // requestId is only meaningful for the socket that issued the command.
        isOriginConnection ? event : withoutRequestId(event),
      );
    }
  }
}

function shouldFanoutToSession(
  events: readonly OutboundEventEnvelope[],
): boolean {
  if (events.length === 0) {
    return false;
  }

  // Rejections and join/reconnect acknowledgements stay connection-local. Only
  // accepted score changes currently fan out to the rest of the session.
  return events.every(
    (event) =>
      event.event === "participant.score.updated" ||
      event.event === "leaderboard.updated",
  );
}

function withoutRequestId(
  event: OutboundEventEnvelope,
): OutboundEventEnvelope {
  if (event.requestId === undefined) {
    return event;
  }

  const { requestId: _requestId, ...eventWithoutRequestId } = event;

  return eventWithoutRequestId;
}

function dispatchProgressionSnapshot(
  connectionRegistry: SessionConnectionRegistry,
  session: SessionAggregate,
): number {
  const recipients = connectionRegistry.getSessionConnections(session.snapshot.quizId);
  let recipientCount = 0;

  for (const recipient of recipients) {
    // Snapshot payloads are recipient-specific because `self` depends on who is reading.
    const payload = buildTransportSessionViewFromSession(
      session,
      recipient.participantId,
    );

    if (!payload) {
      continue;
    }

    recipient.send({
      event: "session.snapshot",
      payload: payload satisfies SessionSnapshotPayload,
    });
    recipientCount += 1;
  }

  return recipientCount;
}
