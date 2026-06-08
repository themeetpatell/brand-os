import { describe, expect, it } from 'vitest'
import { BriefInputSchema } from './types'

const valid = {
  title: 'Summer skincare launch',
  goal: 'Drive trial of a new SPF among college students',
  budgetMin: 8000,
  budgetMax: 25000,
  currency: 'INR',
  niche: 'beauty',
  region: 'IN',
  deliverables: ['1 reel', '2 stories'],
}

describe('BriefInputSchema', () => {
  it('accepts a valid brief', () => {
    expect(BriefInputSchema.parse(valid).niche).toBe('beauty')
  })

  it('rejects budgetMax below budgetMin', () => {
    expect(() => BriefInputSchema.parse({ ...valid, budgetMin: 25000, budgetMax: 8000 })).toThrow()
  })

  it('rejects an empty title', () => {
    expect(() => BriefInputSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('rejects an unknown niche', () => {
    expect(() => BriefInputSchema.parse({ ...valid, niche: 'crypto' })).toThrow()
  })

  it('rejects an empty deliverables list', () => {
    expect(() => BriefInputSchema.parse({ ...valid, deliverables: [] })).toThrow()
  })
})
