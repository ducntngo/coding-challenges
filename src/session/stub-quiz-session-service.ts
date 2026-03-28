import type { QuizDefinitionSource } from "../quiz-source/contracts";
import type { SessionStore } from "../store/contracts";
import type {
  DisconnectParticipantInput,
  JoinSessionInput,
  QuizSessionService,
  ReconnectParticipantInput,
  SessionSnapshot,
} from "./contracts";

export class StubQuizSessionService implements QuizSessionService {
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly quizDefinitionSource: QuizDefinitionSource,
  ) {}

  async joinSession(_input: JoinSessionInput): Promise<SessionSnapshot> {
    throw new Error("joinSession is not implemented in the foundation scaffold.");
  }

  async reconnectParticipant(
    _input: ReconnectParticipantInput,
  ): Promise<SessionSnapshot> {
    throw new Error(
      "reconnectParticipant is not implemented in the foundation scaffold.",
    );
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
