import type { OutboundEventEnvelope } from "./contracts";

export interface SessionConnectionBinding {
  readonly connectionId: string;
  readonly quizId: string;
  readonly participantId: string;
  readonly send: (event: OutboundEventEnvelope) => void;
}

export class SessionConnectionRegistry {
  private readonly bindingsByConnectionId = new Map<
    string,
    {
      quizId: string;
      participantId: string;
    }
  >();

  private readonly currentConnectionsByParticipant = new Map<
    string,
    SessionConnectionBinding
  >();

  bindConnection(binding: SessionConnectionBinding): void {
    const existingBinding = this.bindingsByConnectionId.get(binding.connectionId);

    if (existingBinding) {
      const existingParticipantKey = buildParticipantKey(
        existingBinding.quizId,
        existingBinding.participantId,
      );
      const existingConnection = this.currentConnectionsByParticipant.get(
        existingParticipantKey,
      );

      if (existingConnection?.connectionId === binding.connectionId) {
        this.currentConnectionsByParticipant.delete(existingParticipantKey);
      }
    }

    const participantKey = buildParticipantKey(
      binding.quizId,
      binding.participantId,
    );

    this.bindingsByConnectionId.set(binding.connectionId, {
      quizId: binding.quizId,
      participantId: binding.participantId,
    });
    this.currentConnectionsByParticipant.set(participantKey, binding);
  }

  unbindConnection(input: {
    readonly connectionId: string;
    readonly quizId?: string;
    readonly participantId?: string;
  }): void {
    const existingBinding = this.bindingsByConnectionId.get(input.connectionId);

    this.bindingsByConnectionId.delete(input.connectionId);

    const quizId = existingBinding?.quizId ?? input.quizId;
    const participantId = existingBinding?.participantId ?? input.participantId;

    if (!quizId || !participantId) {
      return;
    }

    const participantKey = buildParticipantKey(quizId, participantId);
    const currentConnection = this.currentConnectionsByParticipant.get(
      participantKey,
    );

    if (currentConnection?.connectionId === input.connectionId) {
      this.currentConnectionsByParticipant.delete(participantKey);
    }
  }

  getSessionConnections(quizId: string): SessionConnectionBinding[] {
    return [...this.currentConnectionsByParticipant.values()].filter(
      (binding) => binding.quizId === quizId,
    );
  }
}

function buildParticipantKey(quizId: string, participantId: string): string {
  return `${quizId}:${participantId}`;
}
