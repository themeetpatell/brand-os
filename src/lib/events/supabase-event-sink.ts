import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventSink, FunnelEvent } from './event-sink'

export class SupabaseEventSink implements EventSink {
  constructor(private readonly client: SupabaseClient) {}

  async record(event: FunnelEvent): Promise<void> {
    const { error } = await this.client.from('funnel_events').insert({
      creator_id: event.creatorId,
      type: event.type,
      payload: event.payload ?? null,
      created_at: event.createdAt,
    })
    // Telemetry must never break the user flow — log and continue.
    if (error) {
      console.error('funnel event record failed', error)
    }
  }
}
