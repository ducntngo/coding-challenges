import type { SessionAggregate } from "../session/contracts";

/**
 * Live session state boundary. A scalable implementation should preserve the
 * same session-scoped atomic semantics even if it stops storing full aggregates.
 */
export interface SessionStore {
  getActiveSession(quizId: string): Promise<SessionAggregate | null>;
  saveSession(session: SessionAggregate): Promise<void>;
}
