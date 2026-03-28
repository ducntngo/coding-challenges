import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import WebSocket from "ws";

import { createApp } from "../../src/app/create-app";
import type { AppDependencies } from "../../src/app/dependencies";
import type { QuizDefinition, QuizDefinitionSource } from "../../src/quiz-source/contracts";
import { NoopScoringService } from "../../src/scoring/noop-scoring-service";
import type { SessionSnapshot } from "../../src/session/contracts";
import { StubQuizSessionService } from "../../src/session/stub-quiz-session-service";
import { InMemorySessionStore } from "../../src/store/in-memory-session-store";
import { DefaultTransportCommandHandler } from "../../src/transport/default-transport-command-handler";
import type {
  InboundCommandEnvelope,
  OutboundEventEnvelope,
  TransportSessionView,
} from "../../src/transport/contracts";

test("headless integration harness covers multiple players across concurrent sessions", async (t) => {
  const deps = buildIntegrationDependencies();
  const app = createApp({
    deps,
    logger: false,
  });
  const clients: IntegrationTestClient[] = [];

  t.after(async () => {
    await Promise.allSettled(clients.map(async (client) => client.close()));
    await app.close();
  });

  const address = await app.listen({
    port: 0,
    host: "127.0.0.1",
  });
  const wsUrl = buildWebSocketUrl(address, "/ws");

  const [aliceConnection, bobConnection, carolConnection, danaConnection] =
    await Promise.all([
      IntegrationTestClient.connect(wsUrl),
      IntegrationTestClient.connect(wsUrl),
      IntegrationTestClient.connect(wsUrl),
      IntegrationTestClient.connect(wsUrl),
    ]);

  clients.push(aliceConnection, bobConnection, carolConnection, danaConnection);

  const [aliceJoinEvent, carolJoinEvent] = await Promise.all([
    aliceConnection.sendCommand({
      command: "session.join",
      requestId: "req-join-alice",
      payload: {
        quizId: "demo-quiz",
        displayName: "Alice",
      },
    }),
    carolConnection.sendCommand({
      command: "session.join",
      requestId: "req-join-carol",
      payload: {
        quizId: "science-quiz",
        displayName: "Carol",
      },
    }),
  ]);

  const aliceJoinPayload = assertSessionEvent(
    aliceJoinEvent,
    "session.joined",
    "demo-quiz",
    1,
  );
  const carolJoinPayload = assertSessionEvent(
    carolJoinEvent,
    "session.joined",
    "science-quiz",
    1,
  );

  const [bobJoinEvent, danaJoinEvent] = await Promise.all([
    bobConnection.sendCommand({
      command: "session.join",
      requestId: "req-join-bob",
      payload: {
        quizId: "demo-quiz",
        displayName: "Bob",
      },
    }),
    danaConnection.sendCommand({
      command: "session.join",
      requestId: "req-join-dana",
      payload: {
        quizId: "science-quiz",
        displayName: "Dana",
      },
    }),
  ]);

  const bobJoinPayload = assertSessionEvent(
    bobJoinEvent,
    "session.joined",
    "demo-quiz",
    2,
  );
  const danaJoinPayload = assertSessionEvent(
    danaJoinEvent,
    "session.joined",
    "science-quiz",
    2,
  );

  assert.equal(
    new Set(
      bobJoinPayload.participants.map((participant) => participant.displayName),
    ).size,
    2,
  );
  assert.deepEqual(
    bobJoinPayload.participants.map((participant) => participant.displayName).sort(),
    ["Alice", "Bob"],
  );
  assert.deepEqual(
    danaJoinPayload.participants
      .map((participant) => participant.displayName)
      .sort(),
    ["Carol", "Dana"],
  );
  assert.notEqual(
    bobJoinPayload.session.sessionInstanceId,
    danaJoinPayload.session.sessionInstanceId,
  );

  const demoSnapshotAfterJoins = await deps.sessionService.getSessionSnapshot(
    "demo-quiz",
  );
  const scienceSnapshotAfterJoins = await deps.sessionService.getSessionSnapshot(
    "science-quiz",
  );

  assert.ok(demoSnapshotAfterJoins);
  assert.ok(scienceSnapshotAfterJoins);
  assert.deepEqual(
    demoSnapshotAfterJoins.participants
      .map((participant) => participant.displayName)
      .sort(),
    ["Alice", "Bob"],
  );
  assert.deepEqual(
    scienceSnapshotAfterJoins.participants
      .map((participant) => participant.displayName)
      .sort(),
    ["Carol", "Dana"],
  );

  const aliceReplacement = await IntegrationTestClient.connect(wsUrl);
  clients.push(aliceReplacement);

  const aliceReconnectEvent = await aliceReplacement.sendCommand({
    command: "session.reconnect",
    requestId: "req-reconnect-alice",
    payload: {
      quizId: "demo-quiz",
      reconnectToken: aliceJoinPayload.self.reconnectToken,
    },
  });

  const aliceReconnectPayload = assertSessionEvent(
    aliceReconnectEvent,
    "session.reconnected",
    "demo-quiz",
    2,
  );

  assert.equal(
    aliceReconnectPayload.self.participantId,
    aliceJoinPayload.self.participantId,
  );

  await aliceConnection.close();
  await sleep(25);

  const demoSnapshotAfterStaleDisconnect =
    await deps.sessionService.getSessionSnapshot("demo-quiz");

  assert.ok(demoSnapshotAfterStaleDisconnect);
  assert.equal(demoSnapshotAfterStaleDisconnect.version, 4);
  assert.deepEqual(
    demoSnapshotAfterStaleDisconnect.participants
      .map((participant) => ({
        displayName: participant.displayName,
        state: participant.state,
      }))
      .sort(compareParticipantViews),
    [
      {
        displayName: "Alice",
        state: "active",
      },
      {
        displayName: "Bob",
        state: "active",
      },
    ],
  );

  await bobConnection.close();

  const demoSnapshotAfterBobDisconnect = await waitForSessionSnapshot(
    deps,
    "demo-quiz",
    (snapshot) =>
      snapshot.version === 5 &&
      snapshot.participants.some(
        (participant) =>
          participant.displayName === "Bob" &&
          participant.state === "disconnected",
      ),
  );

  assert.deepEqual(
    demoSnapshotAfterBobDisconnect.participants
      .map((participant) => ({
        displayName: participant.displayName,
        state: participant.state,
      }))
      .sort(compareParticipantViews),
    [
      {
        displayName: "Alice",
        state: "active",
      },
      {
        displayName: "Bob",
        state: "disconnected",
      },
    ],
  );

  const scienceSnapshotAfterDemoDisconnects =
    await deps.sessionService.getSessionSnapshot("science-quiz");

  assert.ok(scienceSnapshotAfterDemoDisconnects);
  assert.equal(scienceSnapshotAfterDemoDisconnects.version, 2);
  assert.deepEqual(
    scienceSnapshotAfterDemoDisconnects.participants
      .map((participant) => ({
        displayName: participant.displayName,
        state: participant.state,
      }))
      .sort(compareParticipantViews),
    [
      {
        displayName: "Carol",
        state: "active",
      },
      {
        displayName: "Dana",
        state: "active",
      },
    ],
  );

  assert.equal(aliceReplacement.isOpen(), true);
  assert.equal(carolConnection.isOpen(), true);
  assert.equal(danaConnection.isOpen(), true);
  assert.equal(aliceReplacement.isClosed(), false);
  assert.equal(aliceConnection.isClosed(), true);

  assert.match(aliceJoinPayload.self.reconnectToken, /.+/);
  assert.match(carolJoinPayload.self.reconnectToken, /.+/);
});

class StaticQuizDefinitionSource implements QuizDefinitionSource {
  private readonly quizzes: Map<string, QuizDefinition>;

  constructor(quizzes: readonly QuizDefinition[]) {
    this.quizzes = new Map(
      quizzes.map((quizDefinition) => [quizDefinition.quizId, quizDefinition]),
    );
  }

  async getQuizDefinition(quizId: string): Promise<QuizDefinition | null> {
    return this.quizzes.get(quizId) ?? null;
  }
}

class IntegrationTestClient {
  private readonly messageQueue: OutboundEventEnvelope[] = [];
  private readonly waiters: Array<(event: OutboundEventEnvelope) => void> = [];

  private constructor(private readonly socket: WebSocket) {
    this.socket.on("message", (rawData) => {
      const rawMessage =
        typeof rawData === "string" ? rawData : rawData.toString("utf8");
      const event = JSON.parse(rawMessage) as OutboundEventEnvelope;
      const waiter = this.waiters.shift();

      if (waiter) {
        waiter(event);
        return;
      }

      this.messageQueue.push(event);
    });
  }

  static async connect(url: string): Promise<IntegrationTestClient> {
    const socket = new WebSocket(url);

    await waitForWebSocketOpen(socket);

    return new IntegrationTestClient(socket);
  }

  async sendCommand(
    envelope: InboundCommandEnvelope,
  ): Promise<OutboundEventEnvelope> {
    this.socket.send(JSON.stringify(envelope));
    return this.readEvent();
  }

  async close(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) {
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      await once(this.socket, "close");
      return;
    }

    const closed = once(this.socket, "close");
    this.socket.close();
    await closed;
  }

  isOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  isClosed(): boolean {
    return this.socket.readyState === WebSocket.CLOSED;
  }

  private async readEvent(): Promise<OutboundEventEnvelope> {
    const queuedEvent = this.messageQueue.shift();

    if (queuedEvent) {
      return queuedEvent;
    }

    return new Promise<OutboundEventEnvelope>((resolve) => {
      this.waiters.push(resolve);
    });
  }
}

function buildIntegrationDependencies(): AppDependencies {
  const quizDefinitionSource = new StaticQuizDefinitionSource([
    {
      quizId: "demo-quiz",
      title: "Demo Vocabulary Quiz",
      questionIds: ["question-1"],
    },
    {
      quizId: "science-quiz",
      title: "Science Quiz",
      questionIds: ["question-1"],
    },
  ]);
  const sessionStore = new InMemorySessionStore();
  let generatedParticipantId = 0;
  let generatedReconnectToken = 0;
  let generatedSessionId = 0;
  const sessionService = new StubQuizSessionService(
    sessionStore,
    quizDefinitionSource,
    {
      participantIdGenerator: () => {
        generatedParticipantId += 1;
        return `participant-generated-${generatedParticipantId}`;
      },
      reconnectTokenGenerator: () => {
        generatedReconnectToken += 1;
        return `reconnect-token-${generatedReconnectToken}`;
      },
      sessionInstanceIdGenerator: () => {
        generatedSessionId += 1;
        return `session-generated-${generatedSessionId}`;
      },
    },
  );
  const scoringService = new NoopScoringService();
  const transportCommandHandler = new DefaultTransportCommandHandler({
    sessionService,
    scoringService,
  });

  return {
    quizDefinitionSource,
    sessionStore,
    sessionService,
    scoringService,
    transportCommandHandler,
  };
}

function assertSessionEvent(
  event: OutboundEventEnvelope,
  expectedEventName: "session.joined" | "session.reconnected",
  expectedQuizId: string,
  expectedParticipantCount: number,
): TransportSessionView {
  assert.equal(event.event, expectedEventName);

  const payload = event.payload as TransportSessionView;

  assert.equal(payload.session.quizId, expectedQuizId);
  assert.equal(payload.participants.length, expectedParticipantCount);

  return payload;
}

function buildWebSocketUrl(address: string, pathname: string): string {
  const url = new URL(address);

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = pathname;

  return url.toString();
}

async function waitForWebSocketOpen(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.OPEN) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off("open", onOpen);
      socket.off("error", onError);
    };

    socket.on("open", onOpen);
    socket.on("error", onError);
  });
}

async function waitForSessionSnapshot(
  deps: AppDependencies,
  quizId: string,
  predicate: (snapshot: SessionSnapshot) => boolean,
): Promise<SessionSnapshot> {
  const deadline = Date.now() + 1_000;

  while (Date.now() < deadline) {
    const snapshot = await deps.sessionService.getSessionSnapshot(quizId);

    if (snapshot && predicate(snapshot)) {
      return snapshot;
    }

    await sleep(10);
  }

  throw new Error(`Timed out waiting for snapshot condition for ${quizId}.`);
}

function compareParticipantViews(
  left: { displayName: string | null },
  right: { displayName: string | null },
): number {
  return (left.displayName ?? "").localeCompare(right.displayName ?? "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
