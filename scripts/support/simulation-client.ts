import { once } from "node:events";

import WebSocket from "ws";

import type {
  InboundCommandEnvelope,
  OutboundEventEnvelope,
} from "../../src/transport/contracts";

export class SimulationClient {
  private readonly messageQueue: OutboundEventEnvelope[] = [];
  private readonly waiters: Array<(event: OutboundEventEnvelope) => void> = [];

  private constructor(
    private readonly socket: WebSocket,
    private readonly timeoutMs: number,
  ) {
    this.socket.on("message", (rawData) => {
      const rawMessage =
        typeof rawData === "string" ? rawData : rawData.toString("utf8");
      const event = JSON.parse(rawMessage) as OutboundEventEnvelope;
      const waiter = this.waiters.shift();

      if (waiter) {
        waiter(event);
        return;
      }

      this.messageQueue.push(event);
    });
  }

  static async connect(
    url: string,
    timeoutMs: number,
  ): Promise<SimulationClient> {
    const socket = new WebSocket(url);

    await waitForWebSocketOpen(socket, timeoutMs);

    return new SimulationClient(socket, timeoutMs);
  }

  async sendCommand<TPayload>(
    envelope: InboundCommandEnvelope<TPayload>,
  ): Promise<OutboundEventEnvelope> {
    this.socket.send(JSON.stringify(envelope));
    return this.readEvent();
  }

  async sendCommandAndReadEvents<TPayload>(
    envelope: InboundCommandEnvelope<TPayload>,
    expectedEventCount: number,
  ): Promise<OutboundEventEnvelope[]> {
    this.socket.send(JSON.stringify(envelope));
    return this.readEvents(expectedEventCount);
  }

  async readEvents(expectedEventCount: number): Promise<OutboundEventEnvelope[]> {
    const events: OutboundEventEnvelope[] = [];

    for (let index = 0; index < expectedEventCount; index += 1) {
      events.push(await this.readEvent());
    }

    return events;
  }

  drainQueuedEvents(): OutboundEventEnvelope[] {
    return this.messageQueue.splice(0);
  }

  async expectNoEventWithin(timeoutMs: number): Promise<void> {
    const queuedEvent = this.messageQueue.shift();

    if (queuedEvent) {
      throw new Error(
        `Expected no event within ${timeoutMs}ms, but received ${JSON.stringify(queuedEvent)}.`,
      );
    }

    await new Promise<void>((resolve, reject) => {
      const waiter = (event: OutboundEventEnvelope) => {
        cleanup();
        reject(
          new Error(
            `Expected no event within ${timeoutMs}ms, but received ${JSON.stringify(event)}.`,
          ),
        );
      };
      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);

        const waiterIndex = this.waiters.indexOf(waiter);

        if (waiterIndex >= 0) {
          this.waiters.splice(waiterIndex, 1);
        }
      };

      this.waiters.push(waiter);
    });
  }

  async close(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) {
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      await once(this.socket, "close");
      return;
    }

    const closed = once(this.socket, "close");
    this.socket.close();
    await closed;
  }

  private async readEvent(): Promise<OutboundEventEnvelope> {
    const queuedEvent = this.messageQueue.shift();

    if (queuedEvent) {
      return queuedEvent;
    }

    return new Promise<OutboundEventEnvelope>((resolve, reject) => {
      const waiter = (event: OutboundEventEnvelope) => {
        cleanup();
        resolve(event);
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Timed out after ${this.timeoutMs}ms waiting for a transport event.`,
          ),
        );
      }, this.timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);

        const waiterIndex = this.waiters.indexOf(waiter);

        if (waiterIndex >= 0) {
          this.waiters.splice(waiterIndex, 1);
        }
      };

      this.waiters.push(waiter);
    });
  }
}

export function buildWebSocketUrl(address: string, pathname: string): string {
  const url = new URL(address);

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = pathname;

  return url.toString();
}

async function waitForWebSocketOpen(
  socket: WebSocket,
  timeoutMs: number,
): Promise<void> {
  if (socket.readyState === WebSocket.OPEN) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timed out after ${timeoutMs}ms connecting to the local WebSocket server.`,
        ),
      );
    }, timeoutMs);
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("open", onOpen);
      socket.off("error", onError);
    };

    socket.on("open", onOpen);
    socket.on("error", onError);
  });
}
