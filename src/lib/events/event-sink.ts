// Funnel telemetry for the money-cockpit loop: kit created -> shared -> deal
// logged -> paid -> repeat. The Seed-raising metric (GMV routed + % of creators
// logging a real deal) is derived from these events.
export interface FunnelEvent {
  creatorId: string
  type: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface EventSink {
  record(event: FunnelEvent): Promise<void>
}
