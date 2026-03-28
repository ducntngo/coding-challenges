import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import websocket from "@fastify/websocket";

import {
  buildDefaultDependencies,
  type AppDependencies,
} from "./dependencies";
import { buildHealthPayload } from "../observability/health";
import { registerTransportRoutes } from "../transport/register-transport-routes";

export interface CreateAppOptions {
  readonly deps?: AppDependencies;
  readonly logger?: FastifyServerOptions["logger"];
}

export function createApp(options: CreateAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });
  const deps = options.deps ?? buildDefaultDependencies();

  void app.register(websocket);

  app.get("/health", async () => buildHealthPayload());

  registerTransportRoutes(app, deps.transportCommandHandler);

  return app;
}
