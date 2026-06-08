import { describe, expect, it } from 'vitest'
import { acceptApplication } from './accept-application'
import { InMemoryApplicationRepository } from '../repository/in-memory-application-repository'
import { InMemoryBriefRepository } from '../repository/in-memory-brief-repository'
import { InMemoryDealRepository } from '../repository/in-memory-deal-repository'
import { InMemoryEventSink } from '../events/in-memory-event-sink'
import type { Brief } from '../repository/brief-repository'
import type { Application } from '../repository/application-repository'

function setup() {
  const appRepo = new InMemoryApplicationRepository()
  const briefRepo = new InMemoryBriefRepository()
  const dealRepo = new InMemoryDealRepository()
  const events = new InMemoryEventSink()
  const brief: Brief = {
    id: 'brief_1', brandId: 'brand_1', title: 'Launch', goal: 'g',
    budgetMin: 8000, budgetMax: 25000, currency: 'INR', niche: 'beauty', region: 'IN',
    deliverables: ['1 reel', '2 stories'], status: 'open', createdAt: 't',
  }
  const app: Application = {
    id: 'app_1', briefId: 'brief_1', creatorId: 'creator_1', quoteAmount: 18000,
    currency: 'INR', message: 'hi', status: 'applied', createdAt: 't',
  }
  briefRepo.saveBrief(brief)
  appRepo.saveApplication(app)
  return { appRepo, briefRepo, dealRepo, events, idGen: () => 'deal_abc', now: () => 't1' }
}

describe('acceptApplication', () => {
  it('mints a deal, marks the application accepted, and fills the brief', async () => {
    const d = setup()
    const deal = await acceptApplication('brand_1', 'app_1', 'Sugar Cosmetics', d)
    expect(deal.id).toBe('deal_abc')
    expect(deal.creatorId).toBe('creator_1')
    expect(deal.brandName).toBe('Sugar Cosmetics')
    expect(deal.amount).toBe(18000)
    expect(deal.deliverables).toEqual(['1 reel', '2 stories'])
    expect(deal.status).toBe('accepted')
    expect((await d.appRepo.getApplicationById('app_1'))?.status).toBe('accepted')
    expect((await d.briefRepo.getBriefById('brief_1'))?.status).toBe('filled')
  })
  it('refuses to accept an application on a brief the brand does not own', async () => {
    const d = setup()
    await expect(acceptApplication('other_brand', 'app_1', 'X', d)).rejects.toThrow()
  })
  it('throws on an unknown application', async () => {
    const d = setup()
    await expect(acceptApplication('brand_1', 'missing', 'X', d)).rejects.toThrow()
  })
})
