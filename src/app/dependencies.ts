import {
  StubAnswerSubmissionService,
} from "../answer-submission/stub-answer-submission-service";
import type { AnswerSubmissionService } from "../answer-submission/contracts";
import {
  DefaultTransportCommandHandler,
} from "../transport/default-transport-command-handler";
import type { TransportCommandHandler } from "../transport/transport-command-handler";
import {
  MockQuizDefinitionSource,
} from "../quiz-source/mock-quiz-definition-source";
import type { QuizDefinitionSource } from "../quiz-source/contracts";
import {
  InMemorySessionStore,
} from "../store/in-memory-session-store";
import type { SessionStore } from "../store/contracts";
import {
  StubSessionProgressionService,
} from "../session/stub-session-progression-service";
import {
  StubQuizSessionService,
} from "../session/stub-quiz-session-service";
import type {
  QuizSessionService,
  SessionProgressionService,
} from "../session/contracts";
import {
  StubScoringService,
} from "../scoring/stub-scoring-service";
import type { ScoringService } from "../scoring/contracts";

export interface AppDependencies {
  readonly quizDefinitionSource: QuizDefinitionSource;
  readonly sessionStore: SessionStore;
  readonly sessionService: QuizSessionService;
  readonly progressionService: SessionProgressionService;
  readonly scoringService: ScoringService;
  readonly answerSubmissionService: AnswerSubmissionService;
  readonly transportCommandHandler: TransportCommandHandler;
}

export function buildDefaultDependencies(): AppDependencies {
  const quizDefinitionSource = new MockQuizDefinitionSource();
  const sessionStore = new InMemorySessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    quizDefinitionSource,
  );
  const progressionService = new StubSessionProgressionService(
    sessionStore,
    quizDefinitionSource,
  );
  const scoringService = new StubScoringService();
  const answerSubmissionService = new StubAnswerSubmissionService(
    sessionStore,
    quizDefinitionSource,
    scoringService,
  );
  const transportCommandHandler = new DefaultTransportCommandHandler({
    sessionService,
    answerSubmissionService,
  });

  return {
    quizDefinitionSource,
    sessionStore,
    sessionService,
    progressionService,
    scoringService,
    answerSubmissionService,
    transportCommandHandler,
  };
}
