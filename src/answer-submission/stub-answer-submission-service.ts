import type { QuizDefinitionSource } from "../quiz-source/contracts";
import type { ScoringService } from "../scoring/contracts";
import { buildSessionAggregate } from "../session/session-aggregate";
import type { SessionStore } from "../store/contracts";
import type {
  AnswerSubmissionService,
  AnswerSubmissionResult,
  SubmitAnswerInput,
} from "./contracts";

export class StubAnswerSubmissionService implements AnswerSubmissionService {
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly quizDefinitionSource: QuizDefinitionSource,
    private readonly scoringService: ScoringService,
    private readonly now: () => number = Date.now,
  ) {}

  async submitAnswer(input: SubmitAnswerInput): Promise<AnswerSubmissionResult> {
    const quizDefinition = await this.quizDefinitionSource.getQuizDefinition(
      input.quizId,
    );

    if (!quizDefinition) {
      return {
        accepted: false,
        reason: `Quiz ${input.quizId} could not be resolved.`,
      };
    }

    if (!quizDefinition.questionIds.includes(input.questionId)) {
      return {
        accepted: false,
        reason: `Question ${input.questionId} is not part of quiz ${input.quizId}.`,
      };
    }

    const questionDefinition = quizDefinition.questions.find(
      (candidate) => candidate.questionId === input.questionId,
    );

    if (!questionDefinition) {
      return {
        accepted: false,
        reason: `Question ${input.questionId} could not be resolved for quiz ${input.quizId}.`,
      };
    }

    const existingSession = await this.sessionStore.getActiveSession(input.quizId);

    if (!existingSession) {
      return {
        accepted: false,
        reason: `Quiz ${input.quizId} has no active session.`,
      };
    }

    if (existingSession.snapshot.phase !== "question_open") {
      return {
        accepted: false,
        reason: `Answers are not being accepted in phase ${existingSession.snapshot.phase}.`,
      };
    }

    if (existingSession.snapshot.currentQuestionId === null) {
      return {
        accepted: false,
        reason: `Quiz ${input.quizId} has no active question.`,
      };
    }

    if (input.questionId !== existingSession.snapshot.currentQuestionId) {
      return {
        accepted: false,
        reason: `Question ${input.questionId} is not the active question for quiz ${input.quizId}.`,
      };
    }

    const participantRecord = existingSession.participantRecords.find(
      (candidate) => candidate.participantId === input.participantId,
    );

    if (!participantRecord) {
      return {
        accepted: false,
        reason: `Participant ${input.participantId} is not active in quiz ${input.quizId}.`,
      };
    }

    if (participantRecord.answeredQuestionIds.includes(input.questionId)) {
      return {
        accepted: false,
        reason: `Participant ${input.participantId} already answered question ${input.questionId}.`,
      };
    }

    const receivedAtMs = this.now();

    const scoringResult = await this.scoringService.scoreSubmission({
      participantId: input.participantId,
      quizId: input.quizId,
      questionId: input.questionId,
      answer: input.answer,
      acceptedAnswer: questionDefinition.acceptedAnswer,
      questionOpenedAtMs:
        existingSession.currentQuestionOpenedAtMs ?? receivedAtMs,
      receivedAtMs,
      currentScore: participantRecord.score,
    });

    if (!scoringResult.accepted) {
      return {
        accepted: false,
        reason:
          scoringResult.reason ??
          `Answer submission for ${input.questionId} was rejected.`,
      };
    }

    const nextParticipantRecords = existingSession.participantRecords.map(
      (candidate) =>
        candidate.participantId === input.participantId
          ? {
              ...candidate,
              score: scoringResult.totalScore,
              answeredQuestionIds: [
                ...candidate.answeredQuestionIds,
                input.questionId,
              ],
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
      accepted: true,
      participantId: input.participantId,
      quizId: input.quizId,
      questionId: input.questionId,
      scoreDelta: scoringResult.scoreDelta,
      totalScore: scoringResult.totalScore,
      leaderboard: nextSession.snapshot.leaderboard,
    };
  }
}

export type { AnswerSubmissionService } from "./contracts";
