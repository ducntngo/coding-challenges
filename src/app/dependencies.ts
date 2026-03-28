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
  StubQuizSessionService,
} from "../session/stub-quiz-session-service";
import type { QuizSessionService } from "../session/contracts";
import {
  NoopScoringService,
} from "../scoring/noop-scoring-service";
import type { ScoringService } from "../scoring/contracts";

export interface AppDependencies {
  readonly quizDefinitionSource: QuizDefinitionSource;
  readonly sessionStore: SessionStore;
  readonly sessionService: QuizSessionService;
  readonly scoringService: ScoringService;
  readonly transportCommandHandler: TransportCommandHandler;
}

export function buildDefaultDependencies(): AppDependencies {
  const quizDefinitionSource = new MockQuizDefinitionSource();
  const sessionStore = new InMemorySessionStore();
  const sessionService = new StubQuizSessionService(
    sessionStore,
    quizDefinitionSource,
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
