import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../src/app/dependencies";
import { createApp } from "../src/app/create-app";
import { MockQuizDefinitionSource } from "../src/quiz-source/mock-quiz-definition-source";
import { StubQuizSessionService } from "../src/session/stub-quiz-session-service";
import { InMemorySessionStore } from "../src/store/in-memory-session-store";
import type { ConnectionContext } from "../src/transport/connection-context";

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

test("session service join adds participant to the session snapshot", async () => {
  const service = new StubQuizSessionService(
    new InMemorySessionStore(),
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );

  const result = await service.joinSession({
    quizId: "demo-quiz",
    displayName: " Alice ",
    connectionId: "connection-1",
  });

  assert.equal(result.snapshot.quizId, "demo-quiz");
  assert.equal(result.snapshot.sessionInstanceId, "session-demo-001");
  assert.equal(result.snapshot.version, 2);
  assert.deepEqual(result.self, {
    participantId: "participant-1",
    displayName: "Alice",
    state: "active",
    score: 0,
    reconnectToken: "token-1",
  });
  assert.deepEqual(result.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "active",
      score: 0,
    },
  ]);
  assert.deepEqual(result.snapshot.leaderboard, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      score: 0,
      rank: 1,
    },
  ]);
});

test("transport handler joins successfully and binds the connection", async () => {
  const deps = buildDefaultDependencies();
  const ctx: ConnectionContext = {
    connectionId: "connection-1",
    state: "awaiting_bind",
  };

  const events = await deps.transportCommandHandler.handleMessage(
    ctx,
    JSON.stringify({
      command: "session.join",
      requestId: "req-join-1",
      payload: {
        quizId: "demo-quiz",
        displayName: "Alice",
      },
    }),
  );

  assert.equal(ctx.state, "bound");
  assert.equal(ctx.quizId, "demo-quiz");
  assert.ok(typeof ctx.participantId === "string");

  assert.equal(events.length, 1);
  assert.equal(events[0]?.event, "session.joined");
  assert.equal(events[0]?.requestId, "req-join-1");

  const payload = events[0]?.payload as {
    session: {
      phase: string;
      quizId: string;
      sessionInstanceId: string;
      status: string;
      version: number;
    };
    self: {
      displayName: string | null;
      participantId: string;
      reconnectToken: string;
      score: number;
      state: string;
    };
    participants: Array<{
      displayName: string | null;
      participantId: string;
      score: number;
      state: string;
    }>;
    leaderboard: Array<{
      displayName: string | null;
      participantId: string;
      rank: number;
      score: number;
    }>;
  };

  assert.match(payload.self.reconnectToken, /.+/);
  assert.deepEqual(payload, {
    session: {
      quizId: "demo-quiz",
      sessionInstanceId: "session-demo-001",
      status: "active",
      phase: "lobby",
      version: 2,
    },
    self: {
      participantId: ctx.participantId,
      displayName: "Alice",
      state: "active",
      score: 0,
      reconnectToken: payload.self.reconnectToken,
    },
    participants: [
      {
        participantId: ctx.participantId,
        displayName: "Alice",
        state: "active",
        score: 0,
      },
    ],
    leaderboard: [
      {
        participantId: ctx.participantId,
        displayName: "Alice",
        score: 0,
        rank: 1,
      },
    ],
  });
});

test("transport handler maps an unknown quiz to join_rejected", async () => {
  const deps = buildDefaultDependencies();
  const ctx: ConnectionContext = {
    connectionId: "connection-2",
    state: "awaiting_bind",
  };

  const events = await deps.transportCommandHandler.handleMessage(
    ctx,
    JSON.stringify({
      command: "session.join",
      requestId: "req-join-2",
      payload: {
        quizId: "missing-quiz",
      },
    }),
  );

  assert.equal(ctx.state, "awaiting_bind");
  assert.equal(ctx.quizId, undefined);
  assert.equal(ctx.participantId, undefined);
  assert.deepEqual(events, [
    {
      event: "command.rejected",
      requestId: "req-join-2",
      payload: {
        code: "join_rejected",
        message: "Quiz missing-quiz could not be resolved.",
      },
    },
  ]);
});
