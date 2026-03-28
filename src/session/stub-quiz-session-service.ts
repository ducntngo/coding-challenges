import { randomUUID } from "node:crypto";

import type { QuizDefinitionSource } from "../quiz-source/contracts";
import type { SessionStore } from "../store/contracts";
import {
  SessionJoinRejectedError,
  SessionReconnectRejectedError,
} from "./contracts";
import { buildSessionAggregate } from "./session-aggregate";
import type {
  DisconnectParticipantInput,
  JoinSessionInput,
  ParticipantRecord,
  QuizSessionService,
  ReconnectParticipantInput,
  SessionAggregate,
  SessionBindingResult,
  SessionSnapshot,
} from "./contracts";

export interface StubQuizSessionServiceOptions {
  readonly participantIdGenerator?: () => string;
  readonly reconnectTokenGenerator?: () => string;
  readonly sessionInstanceIdGenerator?: () => string;
  readonly now?: () => number;
}

export class StubQuizSessionService implements QuizSessionService {
  private readonly participantIdGenerator: () => string;
  private readonly reconnectTokenGenerator: () => string;
  private readonly sessionInstanceIdGenerator: () => string;
  private readonly now: () => number;

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly quizDefinitionSource: QuizDefinitionSource,
    options: StubQuizSessionServiceOptions = {},
  ) {
    this.participantIdGenerator =
      options.participantIdGenerator ?? randomUUID;
    this.reconnectTokenGenerator =
      options.reconnectTokenGenerator ?? randomUUID;
    this.sessionInstanceIdGenerator =
      options.sessionInstanceIdGenerator ?? randomUUID;
    this.now = options.now ?? Date.now;
  }

  async joinSession(input: JoinSessionInput): Promise<SessionBindingResult> {
    const quiz = await this.quizDefinitionSource.getQuizDefinition(input.quizId);

    if (!quiz) {
      throw new SessionJoinRejectedError(
        `Quiz ${input.quizId} could not be resolved.`,
      );
    }

    const existingSession = await this.sessionStore.getActiveSession(input.quizId);
    const participantRecords = existingSession?.participantRecords ?? [];
    const currentQuestionId =
      existingSession?.snapshot.currentQuestionId ?? quiz.questionIds[0] ?? null;
    const participantRecord: ParticipantRecord = {
      participantId: this.participantIdGenerator(),
      displayName: normalizeDisplayName(input.displayName),
      state: "active",
      score: 0,
      reconnectToken: this.reconnectTokenGenerator(),
      connectionId: input.connectionId,
      joinOrder: participantRecords.length + 1,
      answeredQuestionIds: [],
    };

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: [...participantRecords, participantRecord],
      quizId: input.quizId,
      sessionInstanceId:
        existingSession?.snapshot.sessionInstanceId ??
        this.sessionInstanceIdGenerator(),
      phase: existingSession?.snapshot.phase ?? "question_open",
      currentQuestionId,
      currentQuestionOpenedAtMs: resolveCurrentQuestionOpenedAtMs({
        existingSession,
        participantRecords,
        currentQuestionId,
        now: this.now,
      }),
    });

    await this.sessionStore.saveSession(nextSession);

    return {
      snapshot: nextSession.snapshot,
      self: {
        participantId: participantRecord.participantId,
        displayName: participantRecord.displayName,
        state: participantRecord.state,
        score: participantRecord.score,
        reconnectToken: participantRecord.reconnectToken,
      },
    };
  }

  async reconnectParticipant(
    input: ReconnectParticipantInput,
  ): Promise<SessionBindingResult> {
    const quiz = await this.quizDefinitionSource.getQuizDefinition(input.quizId);

    if (!quiz) {
      throw new SessionReconnectRejectedError(
        `Quiz ${input.quizId} could not be resolved.`,
      );
    }

    const existingSession = await this.sessionStore.getActiveSession(input.quizId);

    if (!existingSession) {
      throw new SessionReconnectRejectedError(
        `Quiz ${input.quizId} has no active session.`,
      );
    }

    const participantRecord = existingSession.participantRecords.find(
      (candidate) => candidate.reconnectToken === input.reconnectToken,
    );

    if (!participantRecord) {
      throw new SessionReconnectRejectedError(
        "Reconnect token is invalid for this session.",
      );
    }

    const nextParticipantRecords = existingSession.participantRecords.map(
      (candidate) =>
        candidate.participantId === participantRecord.participantId
          ? {
              ...candidate,
              state: "active" as const,
              connectionId: input.connectionId,
            }
          : candidate,
    );

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: nextParticipantRecords,
      quizId: input.quizId,
      sessionInstanceId: existingSession.snapshot.sessionInstanceId,
      phase: existingSession.snapshot.phase,
      currentQuestionId: existingSession.snapshot.currentQuestionId,
      currentQuestionOpenedAtMs: existingSession.currentQuestionOpenedAtMs,
    });

    await this.sessionStore.saveSession(nextSession);

    return {
      snapshot: nextSession.snapshot,
      self: {
        participantId: participantRecord.participantId,
        displayName: participantRecord.displayName,
        state: "active",
        score: participantRecord.score,
        reconnectToken: participantRecord.reconnectToken,
      },
    };
  }

  async disconnectParticipant(
    input: DisconnectParticipantInput,
  ): Promise<void> {
    const existingSession = await this.sessionStore.getActiveSession(input.quizId);

    if (!existingSession) {
      return;
    }

    const participantRecord = existingSession.participantRecords.find(
      (candidate) => candidate.participantId === input.participantId,
    );

    if (!participantRecord || participantRecord.connectionId !== input.connectionId) {
      return;
    }

    const nextParticipantRecords = existingSession.participantRecords.map(
      (candidate) => {
        if (candidate.participantId !== input.participantId) {
          return candidate;
        }

        const { connectionId: _connectionId, ...disconnectedParticipant } = candidate;

        return {
          ...disconnectedParticipant,
          state: "disconnected" as const,
        };
      },
    );

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: nextParticipantRecords,
      quizId: input.quizId,
      sessionInstanceId: existingSession.snapshot.sessionInstanceId,
      phase: existingSession.snapshot.phase,
      currentQuestionId: existingSession.snapshot.currentQuestionId,
      currentQuestionOpenedAtMs: existingSession.currentQuestionOpenedAtMs,
    });

    await this.sessionStore.saveSession(nextSession);
  }

  async getSessionSnapshot(quizId: string): Promise<SessionSnapshot | null> {
    const quiz = await this.quizDefinitionSource.getQuizDefinition(quizId);

    if (!quiz) {
      return null;
    }

    const session = await this.sessionStore.getActiveSession(quizId);
    return session?.snapshot ?? null;
  }
}

export type { QuizSessionService } from "./contracts";
function normalizeDisplayName(displayName: string | undefined): string | null {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed : null;
}

function resolveCurrentQuestionOpenedAtMs({
  existingSession,
  participantRecords,
  currentQuestionId,
  now,
}: {
  existingSession: SessionAggregate | null;
  participantRecords: readonly ParticipantRecord[];
  currentQuestionId: string | null;
  now: () => number;
}): number | null {
  if (currentQuestionId === null) {
    return null;
  }

  if (existingSession === null) {
    return now();
  }

  if (
    participantRecords.length === 0 &&
    existingSession.snapshot.phase === "question_open"
  ) {
    return now();
  }

  return existingSession.currentQuestionOpenedAtMs;
}
