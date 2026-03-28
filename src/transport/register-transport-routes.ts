import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import type { RawData, WebSocket } from "ws";

import type { ConnectionContext } from "./connection-context";
import type { TransportCommandHandler } from "./transport-command-handler";

export function registerTransportRoutes(
  app: FastifyInstance,
  handler: TransportCommandHandler,
): void {
  app.get("/ws", { websocket: true }, (socket: WebSocket) => {
    const ctx: ConnectionContext = {
      connectionId: randomUUID(),
      state: "awaiting_bind",
    };

    socket.on("message", async (buffer: RawData) => {
      const rawMessage =
        typeof buffer === "string" ? buffer : buffer.toString("utf8");

      try {
        const events = await handler.handleMessage(ctx, rawMessage);

        for (const event of events) {
          socket.send(JSON.stringify(event));
        }
      } catch (error) {
        app.log.error({ err: error, connectionId: ctx.connectionId }, "transport handler failed");
        socket.send(
          JSON.stringify({
            event: "command.rejected",
            payload: {
              code: "internal_error",
              message: "Unhandled transport error.",
            },
          }),
        );
      }
    });

    socket.on("close", () => {
      void handler.handleDisconnect(ctx).catch((error) => {
        app.log.error(
          {
            err: error,
            connectionId: ctx.connectionId,
            quizId: ctx.quizId,
            participantId: ctx.participantId,
          },
          "transport disconnect handler failed",
        );
      });
    });
  });
}
