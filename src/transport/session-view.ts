import type {
  ParticipantRecord,
  QuizSessionService,
  SessionAggregate,
} from "../session/contracts";
import type { TransportSessionView } from "./contracts";

export function buildTransportSessionView(
  result: Awaited<ReturnType<QuizSessionService["joinSession"]>>,
): TransportSessionView {
  return {
    session: {
      quizId: result.snapshot.quizId,
      sessionInstanceId: result.snapshot.sessionInstanceId,
      status: result.snapshot.status,
      phase: result.snapshot.phase,
      currentQuestionId: result.snapshot.currentQuestionId,
      version: result.snapshot.version,
    },
    self: {
      participantId: result.self.participantId,
      displayName: result.self.displayName,
      state: result.self.state,
      score: result.self.score,
      reconnectToken: result.self.reconnectToken,
    },
    participants: result.snapshot.participants,
    leaderboard: result.snapshot.leaderboard,
  };
}

export function buildTransportSessionViewFromSession(
  session: SessionAggregate,
  participantId: string,
): TransportSessionView | null {
  const participantRecord = session.participantRecords.find(
    (candidate) => candidate.participantId === participantId,
  );

  if (!participantRecord) {
    return null;
  }

  return {
    session: {
      quizId: session.snapshot.quizId,
      sessionInstanceId: session.snapshot.sessionInstanceId,
      status: session.snapshot.status,
      phase: session.snapshot.phase,
      currentQuestionId: session.snapshot.currentQuestionId,
      version: session.snapshot.version,
    },
    self: buildTransportSessionSelf(participantRecord),
    participants: session.snapshot.participants,
    leaderboard: session.snapshot.leaderboard,
  };
}

function buildTransportSessionSelf(
  participantRecord: ParticipantRecord,
): TransportSessionView["self"] {
  return {
    participantId: participantRecord.participantId,
    displayName: participantRecord.displayName,
    state: participantRecord.state,
    score: participantRecord.score,
    reconnectToken: participantRecord.reconnectToken,
  };
}
