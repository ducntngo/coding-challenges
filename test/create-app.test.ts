import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../src/app/dependencies";
import { createApp } from "../src/app/create-app";

test("GET /health returns the minimal health payload", async (t) => {
  const app = createApp({ logger: false });

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json() as {
    service: string;
    status: string;
    timestamp: string;
  };

  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "real-time-quiz-service");
  assert.ok(Number.isFinite(Date.parse(payload.timestamp)));
});

test("transport handler rejects answer.submit before binding", async () => {
  const deps = buildDefaultDependencies();
  const events = await deps.transportCommandHandler.handleMessage(
    {
      connectionId: "connection-1",
      state: "awaiting_bind",
    },
    JSON.stringify({
      command: "answer.submit",
      requestId: "req-1",
      payload: {
        quizId: "demo-quiz",
        questionId: "question-1",
        answer: "answer",
      },
    }),
  );

  assert.deepEqual(events, [
    {
      event: "command.rejected",
      requestId: "req-1",
      payload: {
        code: "not_bound",
        message: "answer.submit requires a bound participant connection.",
      },
    },
  ]);
});
