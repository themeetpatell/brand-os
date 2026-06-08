import { describe, expect, it } from 'vitest'
import { postBrief } from './post-brief'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'

const validBody = {
  title: 'Summer skincare launch',
  goal: 'Drive trial',
  budgetMin: 8000,
  budgetMax: 25000,
  currency: 'INR',
  niche: 'beauty',
  region: 'IN',
  deliverables: ['1 reel', '2 stories'],
}

const deps = () => ({
  repo: new InMemoryBriefRepository(),
  idGen: () => 'brief_abc',
  now: () => '2026-06-08T00:00:00.000Z',
})

describe('postBrief', () => {
  it('persists an open brief and returns it', async () => {
    const d = deps()
    const brief = await postBrief('brand_1', validBody, d)
    expect(brief.id).toBe('brief_abc')
    expect(brief.brandId).toBe('brand_1')
    expect(brief.status).toBe('open')
    expect(brief.createdAt).toBe('2026-06-08T00:00:00.000Z')
    expect((await d.repo.getBriefById('brief_abc'))?.title).toBe('Summer skincare launch')
  })

  it('throws on an invalid body', async () => {
    await expect(postBrief('brand_1', { title: '' }, deps())).rejects.toThrow()
  })

  it('throws when brandId is missing', async () => {
    await expect(postBrief('', validBody, deps())).rejects.toThrow()
  })
})
