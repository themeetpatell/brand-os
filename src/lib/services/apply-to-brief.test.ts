import { describe, expect, it } from 'vitest'
import { applyToBrief } from './apply-to-brief'
import { InMemoryApplicationRepository } from '../repository/in-memory-application-repository'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'
import type { Brief } from '../repository/brief-repository'

function openBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    id: 'brief_1', brandId: 'brand_1', title: 'T', goal: 'g',
    budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN',
    deliverables: ['1 reel'], status: 'open', createdAt: 't', ...overrides,
  }
}

const deps = (brief: Brief) => {
  const briefRepo = new InMemoryBriefRepository()
  briefRepo.saveBrief(brief)
  return { appRepo: new InMemoryApplicationRepository(), briefRepo, idGen: () => 'app_abc', now: () => 't0' }
}

describe('applyToBrief', () => {
  it('creates an application inheriting the brief currency', async () => {
    const d = deps(openBrief())
    const app = await applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)
    expect(app.id).toBe('app_abc')
    expect(app.currency).toBe('INR')
    expect(app.status).toBe('applied')
    expect((await d.appRepo.getApplicationById('app_abc'))?.creatorId).toBe('creator_1')
  })
  it('rejects a second application from the same creator', async () => {
    const d = deps(openBrief())
    await applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 9000, message: 'again' }, d)).rejects.toThrow()
  })
  it('rejects applying to a non-open brief', async () => {
    const d = deps(openBrief({ status: 'filled' }))
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 18000, message: 'hi' }, d)).rejects.toThrow()
  })
  it('throws on invalid input', async () => {
    const d = deps(openBrief())
    await expect(applyToBrief('creator_1', 'brief_1', { quoteAmount: 0, message: '' }, d)).rejects.toThrow()
  })
})
