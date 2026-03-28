import type { SessionAggregate } from "./contracts";

export interface SessionProgressionEvent {
  readonly session: SessionAggregate;
}

export type SessionProgressionListener = (
  event: SessionProgressionEvent,
) => void;

export interface SessionProgressionNotifier {
  publish(event: SessionProgressionEvent): void;
  subscribe(listener: SessionProgressionListener): () => void;
}

export class InMemorySessionProgressionNotifier
  implements SessionProgressionNotifier
{
  private readonly listeners = new Set<SessionProgressionListener>();

  publish(event: SessionProgressionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  subscribe(listener: SessionProgressionListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

