import { describe, expect, it } from 'vitest'
import { CreatorStatsSchema } from './types'

describe('CreatorStatsSchema', () => {
  it('accepts a valid creator stats payload', () => {
    const parsed = CreatorStatsSchema.parse({
      handle: 'aanya.styles',
      displayName: 'Aanya',
      email: 'aanya@example.com',
      niche: 'fashion',
      region: 'IN',
      followerCount: 50000,
      avgLikes: 1400,
      avgComments: 100,
    })
    expect(parsed.niche).toBe('fashion')
  })

  it('rejects zero followers', () => {
    expect(() =>
      CreatorStatsSchema.parse({
        handle: 'x',
        displayName: 'X',
        email: 'x@example.com',
        niche: 'beauty',
        region: 'AE',
        followerCount: 0,
        avgLikes: 0,
        avgComments: 0,
      }),
    ).toThrow()
  })

  it('rejects an unknown niche', () => {
    expect(() =>
      CreatorStatsSchema.parse({
        handle: 'x',
        displayName: 'X',
        email: 'x@example.com',
        niche: 'crypto',
        region: 'IN',
        followerCount: 5000,
        avgLikes: 100,
        avgComments: 5,
      }),
    ).toThrow()
  })
})
