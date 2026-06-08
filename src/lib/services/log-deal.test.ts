import { describe, expect, it } from 'vitest'
import { logDeal } from './log-deal'
import { InMemoryDealRepository } from '../repository/in-memory-deal-repository'
import { InMemoryEventSink } from '../events/in-memory-event-sink'

const validBody = {
  brandName: 'Sugar Cosmetics',
  deliverables: ['1 reel', '3 stories'],
  amount: 18000,
  currency: 'INR',
}

const fixedDeps = () => ({
  repo: new InMemoryDealRepository(),
  events: new InMemoryEventSink(),
  idGen: () => 'deal_abc',
  now: () => '2026-06-08T00:00:00.000Z',
})

describe('logDeal', () => {
  it('persists an offered deal and returns it', async () => {
    const deps = fixedDeps()
    const deal = await logDeal('creator_1', validBody, deps)

    expect(deal.id).toBe('deal_abc')
    expect(deal.creatorId).toBe('creator_1')
    expect(deal.status).toBe('offered')
    expect(deal.offeredAt).toBe('2026-06-08T00:00:00.000Z')
    expect(deal.paidAt).toBeNull()

    const saved = await deps.repo.getDealById('deal_abc')
    expect(saved?.amount).toBe(18000)
  })

  it('records a deal_logged funnel event', async () => {
    const deps = fixedDeps()
    await logDeal('creator_1', validBody, deps)
    const events = deps.events.all()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('deal_logged')
    expect(events[0].creatorId).toBe('creator_1')
  })

  it('throws on an invalid body', async () => {
    const deps = fixedDeps()
    await expect(logDeal('creator_1', { brandName: '' }, deps)).rejects.toThrow()
  })

  it('throws when creatorId is missing', async () => {
    const deps = fixedDeps()
    await expect(logDeal('', validBody, deps)).rejects.toThrow()
  })
})
