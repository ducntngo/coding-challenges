import assert from "node:assert/strict";
import test from "node:test";

import { buildDefaultDependencies } from "../../src/app/dependencies";
import { createApp } from "../../src/app/create-app";
import { MockQuizDefinitionSource } from "../../src/quiz-source/mock-quiz-definition-source";
import { NoopScoringService } from "../../src/scoring/noop-scoring-service";
import { StubQuizSessionService } from "../../src/session/stub-quiz-session-service";
import { InMemorySessionStore } from "../../src/store/in-memory-session-store";
import { DefaultTransportCommandHandler } from "../../src/transport/default-transport-command-handler";
import type { ConnectionContext } from "../../src/transport/connection-context";

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

test("session service reconnect rebinds the existing participant", async () => {
  const service = new StubQuizSessionService(
    new InMemorySessionStore(),
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );

  const joined = await service.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const reconnected = await service.reconnectParticipant({
    quizId: "demo-quiz",
    reconnectToken: joined.self.reconnectToken,
    connectionId: "connection-2",
  });

  assert.equal(reconnected.snapshot.quizId, "demo-quiz");
  assert.equal(reconnected.snapshot.sessionInstanceId, "session-demo-001");
  assert.equal(reconnected.snapshot.version, 3);
  assert.deepEqual(reconnected.self, joined.self);
  assert.deepEqual(reconnected.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "active",
      score: 0,
    },
  ]);
});

test("transport handler reconnects successfully and binds the new connection", async () => {
  const sessionService = new StubQuizSessionService(
    new InMemorySessionStore(),
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );
  const scoringService = new NoopScoringService();
  const transportCommandHandler = new DefaultTransportCommandHandler({
    sessionService,
    scoringService,
  });

  const joined = await sessionService.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  const ctx: ConnectionContext = {
    connectionId: "connection-2",
    state: "awaiting_bind",
  };

  const events = await transportCommandHandler.handleMessage(
    ctx,
    JSON.stringify({
      command: "session.reconnect",
      requestId: "req-reconnect-1",
      payload: {
        quizId: "demo-quiz",
        reconnectToken: joined.self.reconnectToken,
      },
    }),
  );

  assert.equal(ctx.state, "bound");
  assert.equal(ctx.quizId, "demo-quiz");
  assert.equal(ctx.participantId, "participant-1");
  assert.equal(events[0]?.event, "session.reconnected");
  assert.equal(events[0]?.requestId, "req-reconnect-1");

  const payload = events[0]?.payload as {
    session: {
      quizId: string;
      sessionInstanceId: string;
      status: string;
      phase: string;
      version: number;
    };
    self: {
      participantId: string;
      displayName: string | null;
      state: string;
      score: number;
      reconnectToken: string;
    };
  };

  assert.deepEqual(payload.session, {
    quizId: "demo-quiz",
    sessionInstanceId: "session-demo-001",
    status: "active",
    phase: "lobby",
    version: 3,
  });
  assert.deepEqual(payload.self, {
    participantId: "participant-1",
    displayName: "Alice",
    state: "active",
    score: 0,
    reconnectToken: "token-1",
  });
});

test("transport handler maps an invalid reconnect token to reconnect_rejected", async () => {
  const deps = buildDefaultDependencies();
  const ctx: ConnectionContext = {
    connectionId: "connection-3",
    state: "awaiting_bind",
  };

  const events = await deps.transportCommandHandler.handleMessage(
    ctx,
    JSON.stringify({
      command: "session.reconnect",
      requestId: "req-reconnect-2",
      payload: {
        quizId: "demo-quiz",
        reconnectToken: "bad-token",
      },
    }),
  );

  assert.equal(ctx.state, "awaiting_bind");
  assert.equal(ctx.quizId, undefined);
  assert.equal(ctx.participantId, undefined);
  assert.deepEqual(events, [
    {
      event: "command.rejected",
      requestId: "req-reconnect-2",
      payload: {
        code: "reconnect_rejected",
        message: "Reconnect token is invalid for this session.",
      },
    },
  ]);
});

test("session service disconnect marks the active participant as disconnected", async () => {
  const sessionStore = new InMemorySessionStore();
  const service = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );

  const joined = await service.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  await service.disconnectParticipant({
    quizId: "demo-quiz",
    participantId: joined.self.participantId,
    connectionId: "connection-1",
  });

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(session);
  assert.equal(session.snapshot.version, 3);
  assert.deepEqual(session.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "disconnected",
      score: 0,
    },
  ]);
  assert.deepEqual(session.participantRecords, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "disconnected",
      score: 0,
      reconnectToken: "token-1",
      joinOrder: 1,
    },
  ]);
});

test("session service ignores a stale disconnect after reconnect", async () => {
  const sessionStore = new InMemorySessionStore();
  const service = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );

  const joined = await service.joinSession({
    quizId: "demo-quiz",
    displayName: "Alice",
    connectionId: "connection-1",
  });

  await service.reconnectParticipant({
    quizId: "demo-quiz",
    reconnectToken: joined.self.reconnectToken,
    connectionId: "connection-2",
  });

  await service.disconnectParticipant({
    quizId: "demo-quiz",
    participantId: joined.self.participantId,
    connectionId: "connection-1",
  });

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.ok(session);
  assert.equal(session.snapshot.version, 3);
  assert.deepEqual(session.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "active",
      score: 0,
    },
  ]);
  assert.deepEqual(session.participantRecords, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "active",
      score: 0,
      reconnectToken: "token-1",
      connectionId: "connection-2",
      joinOrder: 1,
    },
  ]);
});

test("transport handler forwards disconnect for a bound connection", async () => {
  const sessionStore = new InMemorySessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );
  const transportCommandHandler = new DefaultTransportCommandHandler({
    sessionService,
    scoringService: new NoopScoringService(),
  });
  const ctx: ConnectionContext = {
    connectionId: "connection-1",
    state: "awaiting_bind",
  };

  await transportCommandHandler.handleMessage(
    ctx,
    JSON.stringify({
      command: "session.join",
      requestId: "req-join-disconnect-1",
      payload: {
        quizId: "demo-quiz",
        displayName: "Alice",
      },
    }),
  );

  await transportCommandHandler.handleDisconnect(ctx);

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.equal(ctx.state, "awaiting_bind");
  assert.equal(ctx.quizId, undefined);
  assert.equal(ctx.participantId, undefined);
  assert.ok(session);
  assert.deepEqual(session.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "disconnected",
      score: 0,
    },
  ]);
});

test("transport handler ignores a stale disconnect from a replaced connection", async () => {
  const sessionStore = new InMemorySessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    new MockQuizDefinitionSource(),
    {
      participantIdGenerator: () => "participant-1",
      reconnectTokenGenerator: () => "token-1",
      sessionInstanceIdGenerator: () => "session-created-1",
    },
  );
  const transportCommandHandler = new DefaultTransportCommandHandler({
    sessionService,
    scoringService: new NoopScoringService(),
  });
  const originalCtx: ConnectionContext = {
    connectionId: "connection-1",
    state: "awaiting_bind",
  };

  const joinedEvents = await transportCommandHandler.handleMessage(
    originalCtx,
    JSON.stringify({
      command: "session.join",
      requestId: "req-join-disconnect-2",
      payload: {
        quizId: "demo-quiz",
        displayName: "Alice",
      },
    }),
  );

  const joinedPayload = joinedEvents[0]?.payload as {
    self: {
      reconnectToken: string;
    };
  };
  const replacementCtx: ConnectionContext = {
    connectionId: "connection-2",
    state: "awaiting_bind",
  };

  await transportCommandHandler.handleMessage(
    replacementCtx,
    JSON.stringify({
      command: "session.reconnect",
      requestId: "req-reconnect-disconnect-1",
      payload: {
        quizId: "demo-quiz",
        reconnectToken: joinedPayload.self.reconnectToken,
      },
    }),
  );

  await transportCommandHandler.handleDisconnect(originalCtx);

  const session = await sessionStore.getActiveSession("demo-quiz");

  assert.equal(originalCtx.state, "awaiting_bind");
  assert.equal(originalCtx.quizId, undefined);
  assert.equal(originalCtx.participantId, undefined);
  assert.equal(replacementCtx.state, "bound");
  assert.equal(replacementCtx.quizId, "demo-quiz");
  assert.equal(replacementCtx.participantId, "participant-1");
  assert.ok(session);
  assert.equal(session.snapshot.version, 3);
  assert.deepEqual(session.snapshot.participants, [
    {
      participantId: "participant-1",
      displayName: "Alice",
      state: "active",
      score: 0,
    },
  ]);
});
