import { createApp } from "./app/create-app";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;

async function start(): Promise<void> {
  const app = createApp();
  const host = process.env.HOST ?? DEFAULT_HOST;
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  try {
    await app.listen({ host, port });
  } catch (error) {
    app.log.error({ err: error }, "failed to start server");
    process.exitCode = 1;
  }
}

void start();
