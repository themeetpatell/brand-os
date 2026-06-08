import { describe, expect, it } from 'vitest'
import { InMemoryDealRepository } from './in-memory-deal-repository'
import type { Deal } from './deal-repository'

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal_1',
    creatorId: 'creator_1',
    brandName: 'Sugar Cosmetics',
    deliverables: ['1 reel'],
    amount: 18000,
    currency: 'INR',
    status: 'offered',
    offeredAt: '2026-06-08T00:00:00.000Z',
    paidAt: null,
    ...overrides,
  }
}

describe('InMemoryDealRepository', () => {
  it('saves and retrieves a deal by id', async () => {
    const repo = new InMemoryDealRepository()
    await repo.saveDeal(makeDeal())
    const found = await repo.getDealById('deal_1')
    expect(found?.brandName).toBe('Sugar Cosmetics')
  })

  it('returns null for an unknown id', async () => {
    const repo = new InMemoryDealRepository()
    expect(await repo.getDealById('missing')).toBeNull()
  })

  it('upserts on save with the same id', async () => {
    const repo = new InMemoryDealRepository()
    await repo.saveDeal(makeDeal())
    await repo.saveDeal(makeDeal({ status: 'paid', paidAt: '2026-06-09T00:00:00.000Z' }))
    const found = await repo.getDealById('deal_1')
    expect(found?.status).toBe('paid')
  })

  it('scopes getDealByIdForCreator to the owner', async () => {
    const repo = new InMemoryDealRepository()
    await repo.saveDeal(makeDeal({ id: 'd1', creatorId: 'creator_1' }))
    expect(await repo.getDealByIdForCreator('d1', 'creator_1')).not.toBeNull()
    expect(await repo.getDealByIdForCreator('d1', 'creator_2')).toBeNull()
  })

  it('lists only the given creator deals', async () => {
    const repo = new InMemoryDealRepository()
    await repo.saveDeal(makeDeal({ id: 'd1', creatorId: 'creator_1' }))
    await repo.saveDeal(makeDeal({ id: 'd2', creatorId: 'creator_1' }))
    await repo.saveDeal(makeDeal({ id: 'd3', creatorId: 'creator_2' }))
    const deals = await repo.listDealsByCreator('creator_1')
    expect(deals.map((d) => d.id).sort()).toEqual(['d1', 'd2'])
  })
})
