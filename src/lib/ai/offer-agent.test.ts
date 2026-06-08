import { describe, expect, it } from 'vitest'
import {
  OfferAssessmentSchema,
  assessOfferDeterministic,
  COUNTER_THRESHOLD,
} from './offer-agent'
import type { OfferAssessmentInput } from './offer-agent'

function input(amount: number): OfferAssessmentInput {
  return {
    displayName: 'Aanya',
    floor: 18000,
    offer: {
      brandName: 'Sugar Cosmetics',
      deliverables: ['1 reel', '3 stories'],
      amount,
      currency: 'INR',
    },
  }
}

describe('assessOfferDeterministic', () => {
  it('accepts when the offer meets or beats the floor', () => {
    const result = assessOfferDeterministic(input(18000))
    expect(result.recommendation).toBe('accept')
    expect(result.counterAmount).toBeNull()
    expect(result.draftReply.length).toBeGreaterThan(0)
  })

  it('counters at the floor when the offer is close but below', () => {
    // 18000 * 0.8 = 14400, above the 0.7 threshold -> counter
    const result = assessOfferDeterministic(input(14400))
    expect(result.recommendation).toBe('counter')
    expect(result.counterAmount).toBe(18000)
    expect(result.draftReply).toContain('18,000')
  })

  it('declines when the offer is far below the floor', () => {
    // 18000 * 0.5 = 9000, below the 0.7 threshold -> decline
    const result = assessOfferDeterministic(input(9000))
    expect(result.recommendation).toBe('decline')
    expect(result.counterAmount).toBeNull()
    expect(result.draftReply.length).toBeGreaterThan(0)
  })

  it('exposes a sane counter threshold', () => {
    expect(COUNTER_THRESHOLD).toBeGreaterThan(0)
    expect(COUNTER_THRESHOLD).toBeLessThan(1)
  })
})

describe('OfferAssessmentSchema', () => {
  it('validates a well-formed assessment', () => {
    const parsed = OfferAssessmentSchema.parse({
      recommendation: 'counter',
      counterAmount: 18000,
      reason: 'Below your usual rate for this scope.',
      draftReply: 'Thanks so much! For a reel + 3 stories my rate is INR 18,000.',
    })
    expect(parsed.recommendation).toBe('counter')
  })

  it('rejects an empty reason', () => {
    expect(() =>
      OfferAssessmentSchema.parse({
        recommendation: 'accept',
        counterAmount: null,
        reason: '',
        draftReply: 'ok',
      }),
    ).toThrow()
  })
})
