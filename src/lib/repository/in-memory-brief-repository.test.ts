import { describe, expect, it } from 'vitest'
import { InMemoryBriefRepository } from './in-memory-brief-repository'
import type { Brief } from './brief-repository'

function makeBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: 'brief_1',
    brandId: 'brand_1',
    title: 'Summer skincare launch',
    goal: 'Drive trial',
    budgetMin: 8000,
    budgetMax: 25000,
    currency: 'INR',
    niche: 'beauty',
    region: 'IN',
    deliverables: ['1 reel'],
    status: 'open',
    createdAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('InMemoryBriefRepository', () => {
  it('saves and retrieves a brief by id', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief())
    expect((await repo.getBriefById('brief_1'))?.title).toBe('Summer skincare launch')
  })

  it('returns null for an unknown id', async () => {
    const repo = new InMemoryBriefRepository()
    expect(await repo.getBriefById('missing')).toBeNull()
  })

  it('lists only the given brand briefs', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief({ id: 'b1', brandId: 'brand_1' }))
    await repo.saveBrief(makeBrief({ id: 'b2', brandId: 'brand_2' }))
    const briefs = await repo.listBriefsByBrand('brand_1')
    expect(briefs.map((b) => b.id)).toEqual(['b1'])
  })

  it('lists only open briefs', async () => {
    const repo = new InMemoryBriefRepository()
    await repo.saveBrief(makeBrief({ id: 'b1', status: 'open' }))
    await repo.saveBrief(makeBrief({ id: 'b2', status: 'filled' }))
    const open = await repo.listOpenBriefs()
    expect(open.map((b) => b.id)).toEqual(['b1'])
  })
})
