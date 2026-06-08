import { describe, expect, it } from 'vitest'
import { markDealPaid } from './mark-paid'
import { logDeal } from './log-deal'
import { InMemoryDealRepository } from '../repository/in-memory-deal-repository'
import { InMemoryEventSink } from '../events/in-memory-event-sink'

const validBody = {
  brandName: 'Sugar Cosmetics',
  deliverables: ['1 reel'],
  amount: 18000,
  currency: 'INR',
}

describe('markDealPaid', () => {
  it('flips an offered deal to paid and stamps paidAt', async () => {
    const repo = new InMemoryDealRepository()
    const events = new InMemoryEventSink()
    const logged = await logDeal('creator_1', validBody, {
      repo,
      events,
      idGen: () => 'deal_abc',
      now: () => '2026-06-08T00:00:00.000Z',
    })

    const paid = await markDealPaid(logged.id, {
      repo,
      events,
      now: () => '2026-06-09T12:00:00.000Z',
    })

    expect(paid.status).toBe('paid')
    expect(paid.paidAt).toBe('2026-06-09T12:00:00.000Z')

    const saved = await repo.getDealById('deal_abc')
    expect(saved?.status).toBe('paid')
  })

  it('records a deal_paid funnel event', async () => {
    const repo = new InMemoryDealRepository()
    const events = new InMemoryEventSink()
    const logged = await logDeal('creator_1', validBody, { repo, idGen: () => 'deal_abc', now: () => 't0' })

    await markDealPaid(logged.id, { repo, events, now: () => 't1' })

    const paidEvents = events.all().filter((e) => e.type === 'deal_paid')
    expect(paidEvents).toHaveLength(1)
    expect(paidEvents[0].creatorId).toBe('creator_1')
  })

  it('throws on an unknown deal id', async () => {
    const repo = new InMemoryDealRepository()
    await expect(markDealPaid('missing', { repo })).rejects.toThrow()
  })

  it('is idempotent: a replayed settle does not re-emit an event', async () => {
    const repo = new InMemoryDealRepository()
    const events = new InMemoryEventSink()
    const logged = await logDeal('creator_1', validBody, { repo, idGen: () => 'deal_abc', now: () => 't0' })

    await markDealPaid(logged.id, { repo, events, now: () => 't1' })
    const again = await markDealPaid(logged.id, { repo, events, now: () => 't2' })

    expect(again.paidAt).toBe('t1') // unchanged by the replay
    expect(events.all().filter((e) => e.type === 'deal_paid')).toHaveLength(1)
  })
})
