import type { SessionAggregate } from "../session/contracts";
import type { SessionStore } from "./contracts";

const demoSession: SessionAggregate = {
  snapshot: {
    quizId: "demo-quiz",
    sessionInstanceId: "session-demo-001",
    status: "active",
    phase: "lobby",
    version: 1,
    participants: [],
    leaderboard: [],
  },
};

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionAggregate>([
    [demoSession.snapshot.quizId, demoSession],
  ]);

  async getActiveSession(quizId: string): Promise<SessionAggregate | null> {
    return this.sessions.get(quizId) ?? null;
  }

  async saveSession(session: SessionAggregate): Promise<void> {
    this.sessions.set(session.snapshot.quizId, session);
  }
}

export type { SessionStore } from "./contracts";
