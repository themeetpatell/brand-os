import { createServiceClient } from '../supabase/server-client'
import { SupabaseDealRepository } from '../repository/supabase-deal-repository'
import { SupabaseBriefRepository } from '../repository/supabase-brief-repository'
import { SupabaseEventSink } from '../events/supabase-event-sink'
import { FakePaymentsProvider } from '../payments/fake-payments-provider'
import { CashfreePaymentsProvider } from '../payments/cashfree-provider'
import type { DealRepository } from '../repository/deal-repository'
import type { BriefRepository } from '../repository/brief-repository'
import type { EventSink } from '../events/event-sink'
import type { PaymentsProvider } from '../payments/provider'

export interface ServerDeps {
  dealRepo: DealRepository
  briefRepo: BriefRepository
  events: EventSink
  payments: PaymentsProvider
}

// Use Cashfree when credentials are present. The signature-skipping fake provider
// is ONLY available behind an explicit PAYMENTS_PROVIDER=fake opt-in (dev/E2E) —
// never as a silent production fallback, which would let anyone forge a paid webhook.
export function getPaymentsProvider(): PaymentsProvider {
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    return new CashfreePaymentsProvider()
  }
  if (process.env.PAYMENTS_PROVIDER === 'fake') {
    return new FakePaymentsProvider()
  }
  throw new Error(
    'No payments provider configured (set CASHFREE_* keys, or PAYMENTS_PROVIDER=fake for dev)',
  )
}

export function getServerDeps(): ServerDeps {
  const client = createServiceClient()
  return {
    dealRepo: new SupabaseDealRepository(client),
    briefRepo: new SupabaseBriefRepository(client),
    events: new SupabaseEventSink(client),
    payments: getPaymentsProvider(),
  }
}
