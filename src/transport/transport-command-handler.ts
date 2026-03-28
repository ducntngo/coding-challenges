import type { ConnectionContext } from "./connection-context";
import type { OutboundEventEnvelope } from "./contracts";

export interface TransportCommandHandler {
  handleMessage(
    ctx: ConnectionContext,
    rawMessage: string,
  ): Promise<OutboundEventEnvelope[]>;
  handleDisconnect(ctx: ConnectionContext): Promise<void>;
}
