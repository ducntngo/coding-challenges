import type { QuizDefinitionSource } from "../quiz-source/contracts";
import type { SessionStore } from "../store/contracts";
import {
  SessionProgressionRejectedError,
  type SessionProgressionService,
  type SessionSnapshot,
} from "./contracts";
import { buildSessionAggregate } from "./session-aggregate";

export class StubSessionProgressionService implements SessionProgressionService {
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly quizDefinitionSource: QuizDefinitionSource,
  ) {}

  async closeCurrentQuestion(quizId: string): Promise<SessionSnapshot> {
    const quizDefinition = await this.quizDefinitionSource.getQuizDefinition(quizId);

    if (!quizDefinition) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} could not be resolved.`,
      );
    }

    const existingSession = await this.sessionStore.getActiveSession(quizId);

    if (!existingSession) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} has no active session.`,
      );
    }

    if (existingSession.snapshot.currentQuestionId === null) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} has no active question to close.`,
      );
    }

    if (existingSession.snapshot.phase === "question_closed") {
      return existingSession.snapshot;
    }

    if (existingSession.snapshot.phase === "finished") {
      return existingSession.snapshot;
    }

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: existingSession.participantRecords,
      quizId,
      sessionInstanceId: existingSession.snapshot.sessionInstanceId,
      phase: "question_closed",
      currentQuestionId: existingSession.snapshot.currentQuestionId,
    });

    await this.sessionStore.saveSession(nextSession);

    return nextSession.snapshot;
  }

  async advanceToNextQuestion(quizId: string): Promise<SessionSnapshot> {
    const quizDefinition = await this.quizDefinitionSource.getQuizDefinition(quizId);

    if (!quizDefinition) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} could not be resolved.`,
      );
    }

    const existingSession = await this.sessionStore.getActiveSession(quizId);

    if (!existingSession) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} has no active session.`,
      );
    }

    const currentQuestionId = existingSession.snapshot.currentQuestionId;

    if (currentQuestionId === null) {
      throw new SessionProgressionRejectedError(
        `Quiz ${quizId} has no active question to advance.`,
      );
    }

    const currentQuestionIndex = quizDefinition.questionIds.indexOf(currentQuestionId);

    if (currentQuestionIndex === -1) {
      throw new SessionProgressionRejectedError(
        `Question ${currentQuestionId} is not part of quiz ${quizId}.`,
      );
    }

    const nextQuestionId = quizDefinition.questionIds[currentQuestionIndex + 1] ?? null;

    const nextSession = buildSessionAggregate({
      existingSession,
      participantRecords: existingSession.participantRecords,
      quizId,
      sessionInstanceId: existingSession.snapshot.sessionInstanceId,
      phase: nextQuestionId === null ? "finished" : "question_open",
      currentQuestionId: nextQuestionId,
    });

    await this.sessionStore.saveSession(nextSession);

    return nextSession.snapshot;
  }
}

export type { SessionProgressionService } from "./contracts";
