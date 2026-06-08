import type { EventSink, FunnelEvent } from './event-sink'

export class InMemoryEventSink implements EventSink {
  private readonly events: FunnelEvent[] = []

  async record(event: FunnelEvent): Promise<void> {
    this.events.push(event)
  }

  all(): readonly FunnelEvent[] {
    return [...this.events]
  }
}
