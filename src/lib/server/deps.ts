import { createServerClient } from '../supabase/server-client'
import { SupabaseDealRepository } from '../repository/supabase-deal-repository'
import { SupabaseEventSink } from '../events/supabase-event-sink'
import { FakePaymentsProvider } from '../payments/fake-payments-provider'
import { CashfreePaymentsProvider } from '../payments/cashfree-provider'
import type { DealRepository } from '../repository/deal-repository'
import type { EventSink } from '../events/event-sink'
import type { PaymentsProvider } from '../payments/provider'

export interface ServerDeps {
  dealRepo: DealRepository
  events: EventSink
  payments: PaymentsProvider
}

// Use Cashfree when credentials are present; otherwise the float-free fake (dev/E2E).
export function getPaymentsProvider(): PaymentsProvider {
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    return new CashfreePaymentsProvider()
  }
  return new FakePaymentsProvider()
}

export function getServerDeps(): ServerDeps {
  const client = createServerClient()
  return {
    dealRepo: new SupabaseDealRepository(client),
    events: new SupabaseEventSink(client),
    payments: getPaymentsProvider(),
  }
}
