import { describe, expect, it } from 'vitest'
import { InMemoryKitRepository } from './in-memory-kit-repository'
import type { KitRecord } from './kit-repository'

const record: KitRecord = {
  slug: 'aanya-styles-abc123',
  stats: {
    handle: 'aanya.styles',
    displayName: 'Aanya',
    email: 'aanya@example.com',
    niche: 'fashion',
    region: 'IN',
    followerCount: 50000,
    avgLikes: 1400,
    avgComments: 100,
  },
  engagementRate: 3.0,
  tier: 'micro',
  rateCard: {
    currency: 'INR',
    reel: { min: 14000, max: 21100 },
    story: { min: 4300, max: 6500 },
    carousel: { min: 10800, max: 16200 },
    bundle: { min: 24300, max: 36500 },
  },
  copy: {
    headline: 'Fashion creator',
    bio: 'bio',
    audienceSummary: 'audience',
    brandFitCategories: ['fashion'],
    highlights: ['highlight'],
  },
}

describe('InMemoryKitRepository', () => {
  it('saves and retrieves by slug', async () => {
    const repo = new InMemoryKitRepository()
    await repo.saveKit(record)
    const found = await repo.getKitBySlug('aanya-styles-abc123')
    expect(found?.stats.handle).toBe('aanya.styles')
  })

  it('returns null for an unknown slug', async () => {
    const repo = new InMemoryKitRepository()
    expect(await repo.getKitBySlug('missing')).toBeNull()
  })
})
