import { randomUUID } from "node:crypto";

import type { QuizDefinitionSource } from "../quiz-source/contracts";
import type { SessionStore } from "../store/contracts";
import {
  SessionJoinRejectedError,
  SessionReconnectRejectedError,
} from "./contracts";
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
}

export class StubQuizSessionService implements QuizSessionService {
  private readonly participantIdGenerator: () => string;
  private readonly reconnectTokenGenerator: () => string;
  private readonly sessionInstanceIdGenerator: () => string;

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
    const participantRecord: ParticipantRecord = {
      participantId: this.participantIdGenerator(),
      displayName: normalizeDisplayName(input.displayName),
      state: "active",
      score: 0,
      reconnectToken: this.reconnectTokenGenerator(),
      connectionId: input.connectionId,
      joinOrder: participantRecords.length + 1,
    };

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: [...participantRecords, participantRecord],
      quizId: input.quizId,
      sessionInstanceId:
        existingSession?.snapshot.sessionInstanceId ??
        this.sessionInstanceIdGenerator(),
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
    _input: DisconnectParticipantInput,
  ): Promise<void> {
    return;
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

function buildSessionAggregate({
  existingSession,
  participantRecords,
  quizId,
  sessionInstanceId,
}: {
  existingSession: SessionAggregate | null;
  participantRecords: readonly ParticipantRecord[];
  quizId: string;
  sessionInstanceId: string;
}): SessionAggregate {
  return {
    snapshot: {
      quizId,
      sessionInstanceId,
      status: "active",
      phase: existingSession?.snapshot.phase ?? "lobby",
      version: (existingSession?.snapshot.version ?? 0) + 1,
      participants: participantRecords.map((participantRecord) => ({
        participantId: participantRecord.participantId,
        displayName: participantRecord.displayName,
        state: participantRecord.state,
        score: participantRecord.score,
      })),
      leaderboard: [...participantRecords]
        .sort(compareParticipantRecordsForLeaderboard)
        .map((participantRecord, index) => ({
          participantId: participantRecord.participantId,
          displayName: participantRecord.displayName,
          score: participantRecord.score,
          rank: index + 1,
        })),
    },
    participantRecords,
  };
}

function compareParticipantRecordsForLeaderboard(
  left: ParticipantRecord,
  right: ParticipantRecord,
): number {
  return right.score - left.score || left.joinOrder - right.joinOrder;
}

function normalizeDisplayName(displayName: string | undefined): string | null {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed : null;
}
