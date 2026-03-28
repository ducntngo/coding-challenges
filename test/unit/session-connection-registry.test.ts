import assert from "node:assert/strict";
import test from "node:test";

import type { OutboundEventEnvelope } from "../../src/transport/contracts";
import { SessionConnectionRegistry } from "../../src/transport/session-connection-registry";

test("session connection registry keeps only the current connection per participant", () => {
  const registry = new SessionConnectionRegistry();
  const firstDelivered: OutboundEventEnvelope[] = [];
  const replacementDelivered: OutboundEventEnvelope[] = [];

  registry.bindConnection({
    connectionId: "connection-1",
    quizId: "demo-quiz",
    participantId: "participant-1",
    send: (event) => {
      firstDelivered.push(event);
    },
  });

  registry.bindConnection({
    connectionId: "connection-2",
    quizId: "demo-quiz",
    participantId: "participant-1",
    send: (event) => {
      replacementDelivered.push(event);
    },
  });

  const currentConnections = registry.getSessionConnections("demo-quiz");

  assert.equal(currentConnections.length, 1);
  assert.equal(currentConnections[0]?.connectionId, "connection-2");

  currentConnections[0]?.send({
    event: "leaderboard.updated",
    payload: {
      quizId: "demo-quiz",
      leaderboard: [],
    },
  });

  assert.equal(firstDelivered.length, 0);
  assert.equal(replacementDelivered.length, 1);

  registry.unbindConnection({
    connectionId: "connection-1",
    quizId: "demo-quiz",
    participantId: "participant-1",
  });

  assert.equal(registry.getSessionConnections("demo-quiz").length, 1);

  registry.unbindConnection({
    connectionId: "connection-2",
    quizId: "demo-quiz",
    participantId: "participant-1",
  });

  assert.equal(registry.getSessionConnections("demo-quiz").length, 0);
});

test("session connection registry scopes recipients by quiz", () => {
  const registry = new SessionConnectionRegistry();

  registry.bindConnection({
    connectionId: "connection-1",
    quizId: "demo-quiz",
    participantId: "participant-1",
    send: () => {},
  });
  registry.bindConnection({
    connectionId: "connection-2",
    quizId: "science-quiz",
    participantId: "participant-2",
    send: () => {},
  });
  registry.bindConnection({
    connectionId: "connection-3",
    quizId: "demo-quiz",
    participantId: "participant-3",
    send: () => {},
  });

  assert.deepEqual(
    registry
      .getSessionConnections("demo-quiz")
      .map((connection) => connection.connectionId)
      .sort(),
    ["connection-1", "connection-3"],
  );
  assert.deepEqual(
    registry
      .getSessionConnections("science-quiz")
      .map((connection) => connection.connectionId),
    ["connection-2"],
  );
});
