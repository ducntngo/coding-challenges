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
  InMemorySessionProgressionNotifier,
  type SessionProgressionNotifier,
} from "../session/session-progression-events";
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
  readonly sessionProgressionNotifier: SessionProgressionNotifier;
  readonly scoringService: ScoringService;
  readonly answerSubmissionService: AnswerSubmissionService;
  readonly transportCommandHandler: TransportCommandHandler;
}

export interface BuildDefaultDependenciesOptions {
  readonly now?: () => number;
  readonly quizDefinitionSource?: QuizDefinitionSource;
}

export function buildDefaultDependencies(
  options: BuildDefaultDependenciesOptions = {},
): AppDependencies {
  const now = options.now ?? Date.now;
  const quizDefinitionSource =
    options.quizDefinitionSource ?? new MockQuizDefinitionSource();
  const sessionStore = new InMemorySessionStore();
  const sessionProgressionNotifier = new InMemorySessionProgressionNotifier();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    quizDefinitionSource,
    {
      now,
    },
  );
  const progressionService = new StubSessionProgressionService(
    sessionStore,
    quizDefinitionSource,
    sessionProgressionNotifier,
    now,
  );
  const scoringService = new StubScoringService();
  const answerSubmissionService = new StubAnswerSubmissionService(
    sessionStore,
    quizDefinitionSource,
    scoringService,
    now,
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
    sessionProgressionNotifier,
    scoringService,
    answerSubmissionService,
    transportCommandHandler,
  };
}
