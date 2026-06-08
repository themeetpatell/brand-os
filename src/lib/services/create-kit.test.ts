import { describe, expect, it } from 'vitest'
import { createKit } from './create-kit'
import { InMemoryKitRepository } from '../repository/in-memory-kit-repository'
import type { CopyGenerator } from '../ai/media-kit-copy'

const fakeCopy: CopyGenerator = async (input) => ({
  headline: `${input.niche} creator`,
  bio: 'bio',
  audienceSummary: 'audience',
  brandFitCategories: [input.niche],
  highlights: [`ER ${input.engagementRate}%`],
})

const validBody = {
  handle: 'aanya.styles',
  displayName: 'Aanya',
  email: 'aanya@example.com',
  niche: 'fashion',
  region: 'IN',
  followerCount: 50000,
  avgLikes: 1400,
  avgComments: 100,
}

describe('createKit', () => {
  it('computes, generates copy, persists, and returns a slug', async () => {
    const repo = new InMemoryKitRepository()
    const result = await createKit(validBody, {
      repo,
      generateCopy: fakeCopy,
      idGen: () => 'abc123',
    })
    expect(result.slug).toBe('aanya-styles-abc123')

    const saved = await repo.getKitBySlug('aanya-styles-abc123')
    expect(saved?.engagementRate).toBe(3.0)
    expect(saved?.tier).toBe('micro')
    expect(saved?.rateCard.reel).toEqual({ min: 14000, max: 21100 })
    expect(saved?.copy.headline).toBe('fashion creator')
  })

  it('throws a validation error on a bad body', async () => {
    const repo = new InMemoryKitRepository()
    await expect(
      createKit({ ...validBody, followerCount: 0 }, {
        repo,
        generateCopy: fakeCopy,
        idGen: () => 'abc123',
      }),
    ).rejects.toThrow()
  })
})
