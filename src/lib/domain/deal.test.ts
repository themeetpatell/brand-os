import { describe, expect, it } from 'vitest'
import { DealInputSchema } from './types'

describe('DealInputSchema', () => {
  it('accepts a valid logged-deal payload', () => {
    const parsed = DealInputSchema.parse({
      brandName: 'Sugar Cosmetics',
      deliverables: ['1 reel', '3 stories'],
      amount: 18000,
      currency: 'INR',
    })
    expect(parsed.deliverables.length).toBe(2)
    expect(parsed.currency).toBe('INR')
  })

  it('rejects an empty brand name', () => {
    expect(() =>
      DealInputSchema.parse({
        brandName: '',
        deliverables: ['1 reel'],
        amount: 1000,
        currency: 'INR',
      }),
    ).toThrow()
  })

  it('rejects a non-positive amount', () => {
    expect(() =>
      DealInputSchema.parse({
        brandName: 'X',
        deliverables: ['1 reel'],
        amount: 0,
        currency: 'AED',
      }),
    ).toThrow()
  })

  it('rejects an empty deliverables list', () => {
    expect(() =>
      DealInputSchema.parse({
        brandName: 'X',
        deliverables: [],
        amount: 1000,
        currency: 'INR',
      }),
    ).toThrow()
  })

  it('rejects an unknown currency', () => {
    expect(() =>
      DealInputSchema.parse({
        brandName: 'X',
        deliverables: ['1 reel'],
        amount: 1000,
        currency: 'USD',
      }),
    ).toThrow()
  })
})
