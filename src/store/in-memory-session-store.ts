import type { SessionAggregate } from "../session/contracts";
import type { SessionStore } from "./contracts";

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionAggregate>([
    ["demo-quiz", buildSeededDemoSession()],
  ]);

  async getActiveSession(quizId: string): Promise<SessionAggregate | null> {
    return this.sessions.get(quizId) ?? null;
  }

  async saveSession(session: SessionAggregate): Promise<void> {
    this.sessions.set(session.snapshot.quizId, session);
  }
}

export type { SessionStore } from "./contracts";

function buildSeededDemoSession(): SessionAggregate {
  return {
    snapshot: {
      quizId: "demo-quiz",
      sessionInstanceId: "session-demo-001",
      status: "active",
      phase: "question_open",
      currentQuestionId: "question-1",
      version: 1,
      participants: [],
      leaderboard: [],
    },
    participantRecords: [],
    currentQuestionOpenedAtMs: Date.now(),
  };
}
