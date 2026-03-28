import type { ParticipantRecord, SessionAggregate } from "./contracts";

export function buildSessionAggregate({
  existingSession,
  participantRecords,
  quizId,
  sessionInstanceId,
  phase,
  currentQuestionId,
}: {
  existingSession: SessionAggregate | null;
  participantRecords: readonly ParticipantRecord[];
  quizId: string;
  sessionInstanceId: string;
  phase: SessionAggregate["snapshot"]["phase"];
  currentQuestionId: string | null;
}): SessionAggregate {
  return {
    snapshot: {
      quizId,
      sessionInstanceId,
      status: "active",
      phase,
      currentQuestionId,
      version: (existingSession?.snapshot.version ?? 0) + 1,
      participants: participantRecords.map((participantRecord) => ({
        participantId: participantRecord.participantId,
        displayName: participantRecord.displayName,
        state: participantRecord.state,
        score: participantRecord.score,
      })),
      leaderboard: [...participantRecords]
        .sort(compareParticipantRecordsForLeaderboard)
        .map((participantRecord, index) => ({
          participantId: participantRecord.participantId,
          displayName: participantRecord.displayName,
          score: participantRecord.score,
          rank: index + 1,
        })),
    },
    participantRecords,
  };
}

function compareParticipantRecordsForLeaderboard(
  left: ParticipantRecord,
  right: ParticipantRecord,
): number {
  return right.score - left.score || left.joinOrder - right.joinOrder;
}
