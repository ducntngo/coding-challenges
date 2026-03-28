import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProgressionDispatchLogEvent,
  buildTransportRuntimeLogEvents,
  extractInboundCommandSummary,
} from "../../src/observability/runtime-log-events";

test("extractInboundCommandSummary returns command and requestId when present", () => {
  assert.deepEqual(
    extractInboundCommandSummary(
      JSON.stringify({
        command: "answer.submit",
        requestId: "req-1",
        payload: {},
      }),
    ),
    {
      command: "answer.submit",
      requestId: "req-1",
    },
  );
});

test("buildTransportRuntimeLogEvents summarizes join outcomes", () => {
  const logs = buildTransportRuntimeLogEvents({
    connectionId: "connection-1",
    inbound: {
      command: "session.join",
      requestId: "req-join-1",
    },
    events: [
      {
        event: "session.joined",
        requestId: "req-join-1",
        payload: {
          session: {
            quizId: "demo-quiz",
            sessionInstanceId: "session-demo-001",
            status: "active",
            phase: "question_open",
            currentQuestionId: "question-1",
            version: 2,
          },
          self: {
            participantId: "participant-1",
            displayName: "Alice",
            state: "active",
            score: 0,
            reconnectToken: "token-1",
          },
          participants: [
            {
              participantId: "participant-1",
              displayName: "Alice",
              state: "active",
              score: 0,
            },
          ],
          leaderboard: [
            {
              participantId: "participant-1",
              displayName: "Alice",
              score: 0,
              rank: 1,
            },
          ],
        },
      },
    ],
  });

  assert.deepEqual(logs, [
    {
      level: "info",
      message: "participant joined",
      fields: {
        connectionId: "connection-1",
        command: "session.join",
        requestId: "req-join-1",
        quizId: "demo-quiz",
        sessionInstanceId: "session-demo-001",
        participantId: "participant-1",
        participantCount: 1,
      },
    },
  ]);
});

test("buildTransportRuntimeLogEvents summarizes accepted answers and leaderboard updates", () => {
  const logs = buildTransportRuntimeLogEvents({
    connectionId: "connection-2",
    inbound: {
      command: "answer.submit",
      requestId: "req-answer-1",
    },
    events: [
      {
        event: "participant.score.updated",
        requestId: "req-answer-1",
        payload: {
          quizId: "demo-quiz",
          participantId: "participant-1",
          questionId: "question-1",
          scoreDelta: 80,
          totalScore: 80,
        },
      },
      {
        event: "leaderboard.updated",
        requestId: "req-answer-1",
        payload: {
          quizId: "demo-quiz",
          leaderboard: [
            {
              participantId: "participant-1",
              displayName: "Alice",
              score: 80,
              rank: 1,
            },
          ],
        },
      },
    ],
  });

  assert.deepEqual(logs, [
    {
      level: "info",
      message: "answer accepted",
      fields: {
        connectionId: "connection-2",
        command: "answer.submit",
        requestId: "req-answer-1",
        quizId: "demo-quiz",
        participantId: "participant-1",
        questionId: "question-1",
        scoreDelta: 80,
        totalScore: 80,
      },
    },
    {
      level: "info",
      message: "leaderboard updated",
      fields: {
        connectionId: "connection-2",
        command: "answer.submit",
        requestId: "req-answer-1",
        quizId: "demo-quiz",
        leaderboardSize: 1,
        topParticipantId: "participant-1",
        topScore: 80,
      },
    },
  ]);
});

test("buildTransportRuntimeLogEvents summarizes rejected commands", () => {
  const logs = buildTransportRuntimeLogEvents({
    connectionId: "connection-3",
    quizId: "demo-quiz",
    participantId: "participant-2",
    inbound: {
      command: "answer.submit",
      requestId: "req-answer-2",
    },
    events: [
      {
        event: "command.rejected",
        requestId: "req-answer-2",
        payload: {
          code: "answer_rejected",
          message: "Participant participant-2 already answered question question-1.",
        },
      },
    ],
  });

  assert.deepEqual(logs, [
    {
      level: "warn",
      message: "transport command rejected",
      fields: {
        connectionId: "connection-3",
        command: "answer.submit",
        requestId: "req-answer-2",
        quizId: "demo-quiz",
        participantId: "participant-2",
        rejectionCode: "answer_rejected",
        rejectionMessage:
          "Participant participant-2 already answered question question-1.",
      },
    },
  ]);
});

test("buildProgressionDispatchLogEvent summarizes snapshot fanout", () => {
  const log = buildProgressionDispatchLogEvent({
    session: {
      snapshot: {
        quizId: "demo-quiz",
        sessionInstanceId: "session-demo-001",
        status: "active",
        phase: "question_closed",
        currentQuestionId: "question-1",
        version: 4,
        participants: [],
        leaderboard: [],
      },
      participantRecords: [],
      currentQuestionOpenedAtMs: 1234,
    },
    recipientCount: 2,
  });

  assert.deepEqual(log, {
    level: "info",
    message: "session snapshot dispatched",
    fields: {
      quizId: "demo-quiz",
      sessionInstanceId: "session-demo-001",
      phase: "question_closed",
      currentQuestionId: "question-1",
      recipientCount: 2,
    },
  });
});
