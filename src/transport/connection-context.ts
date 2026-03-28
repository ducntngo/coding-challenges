export type ConnectionBindingState = "awaiting_bind" | "bound";

export interface ConnectionContext {
  readonly connectionId: string;
  state: ConnectionBindingState;
  quizId?: string;
  participantId?: string;
}
