import { nanoid } from 'nanoid'
import { DealInputSchema } from '../domain/types'
import type { Deal, DealRepository } from '../repository/deal-repository'
import type { IdGenerator } from '../repository/slug'
import type { EventSink } from '../events/event-sink'

export type Clock = () => string

export interface LogDealDeps {
  repo: DealRepository
  events?: EventSink
  idGen?: IdGenerator
  now?: Clock
}

export async function logDeal(
  creatorId: string,
  body: unknown,
  deps: LogDealDeps,
): Promise<Deal> {
  if (!creatorId) {
    throw new Error('creatorId is required')
  }
  const input = DealInputSchema.parse(body)
  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())

  const deal: Deal = {
    ...input,
    id: idGen(),
    creatorId,
    status: 'offered',
    offeredAt: now(),
    paidAt: null,
  }
  await deps.repo.saveDeal(deal)
  await deps.events?.record({
    creatorId,
    type: 'deal_logged',
    payload: { dealId: deal.id, amount: deal.amount, currency: deal.currency },
    createdAt: deal.offeredAt,
  })
  return deal
}
