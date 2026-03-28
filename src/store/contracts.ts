import type { SessionAggregate } from "../session/contracts";

export interface SessionStore {
  getActiveSession(quizId: string): Promise<SessionAggregate | null>;
  saveSession(session: SessionAggregate): Promise<void>;
}
