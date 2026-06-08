import { describe, expect, it } from 'vitest'
import { ApplicationInputSchema, CreatorProfileSchema } from './types'

describe('ApplicationInputSchema', () => {
  it('accepts a valid application', () => {
    expect(ApplicationInputSchema.parse({ quoteAmount: 18000, message: 'I love this brand.' }).quoteAmount).toBe(18000)
  })
  it('rejects a non-positive quote', () => {
    expect(() => ApplicationInputSchema.parse({ quoteAmount: 0, message: 'hi' })).toThrow()
  })
  it('rejects an empty message', () => {
    expect(() => ApplicationInputSchema.parse({ quoteAmount: 1000, message: '' })).toThrow()
  })
})

describe('CreatorProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(CreatorProfileSchema.parse({ niche: 'beauty', region: 'IN', rateFloor: 12000 }).niche).toBe('beauty')
  })
  it('rejects an unknown niche', () => {
    expect(() => CreatorProfileSchema.parse({ niche: 'crypto', region: 'IN', rateFloor: 1 })).toThrow()
  })
  it('rejects a non-positive floor', () => {
    expect(() => CreatorProfileSchema.parse({ niche: 'beauty', region: 'IN', rateFloor: 0 })).toThrow()
  })
})
