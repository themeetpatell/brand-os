import { describe, expect, it } from 'vitest'
import { MediaKitCopySchema, buildFallbackMediaKitCopy } from './media-kit-copy'

describe('MediaKitCopySchema', () => {
  it('validates a well-formed copy object', () => {
    const parsed = MediaKitCopySchema.parse({
      headline: 'Mumbai fashion & thrift creator',
      bio: 'I style affordable outfits for college students.',
      audienceSummary: '70% women, 18-27, India metros.',
      brandFitCategories: ['fashion', 'thrift', 'accessories'],
      highlights: ['Avg 3% engagement', 'Strong reels reach'],
    })
    expect(parsed.brandFitCategories.length).toBe(3)
  })

  it('rejects empty headline', () => {
    expect(() =>
      MediaKitCopySchema.parse({
        headline: '',
        bio: 'x',
        audienceSummary: 'x',
        brandFitCategories: ['fashion'],
        highlights: ['x'],
      }),
    ).toThrow()
  })
})

describe('buildFallbackMediaKitCopy', () => {
  it('produces schema-valid, stats-grounded copy', () => {
    const copy = buildFallbackMediaKitCopy({
      handle: 'aanya.styles',
      displayName: 'Aanya',
      email: 'aanya@example.com',
      niche: 'fashion',
      region: 'IN',
      followerCount: 50000,
      avgLikes: 1400,
      avgComments: 100,
      engagementRate: 3.0,
      tier: 'micro',
    })
    expect(() => MediaKitCopySchema.parse(copy)).not.toThrow()
    expect(copy.bio).toContain('50,000')
    expect(copy.brandFitCategories).toContain('fashion')
  })
})
