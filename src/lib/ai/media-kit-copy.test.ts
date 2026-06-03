import { describe, expect, it } from 'vitest'
import { MediaKitCopySchema } from './media-kit-copy'

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
