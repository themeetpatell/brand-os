import type { Deal, DealRepository } from '../repository/deal-repository'
import type { EventSink } from '../events/event-sink'
import type { Clock } from './log-deal'

export interface MarkPaidDeps {
  repo: DealRepository
  events?: EventSink
  now?: Clock
}

export async function markDealPaid(dealId: string, deps: MarkPaidDeps): Promise<Deal> {
  const existing = await deps.repo.getDealById(dealId)
  if (!existing) {
    throw new Error(`deal not found: ${dealId}`)
  }
  // Idempotent: a replayed/redelivered webhook must not re-settle or re-emit.
  if (existing.status === 'paid') {
    return existing
  }
  const now = deps.now ?? (() => new Date().toISOString())
  const paidAt = now()

  const updated: Deal = { ...existing, status: 'paid', paidAt }
  await deps.repo.saveDeal(updated)
  await deps.events?.record({
    creatorId: existing.creatorId,
    type: 'deal_paid',
    payload: { dealId, amount: existing.amount, currency: existing.currency },
    createdAt: paidAt,
  })
  return updated
}
