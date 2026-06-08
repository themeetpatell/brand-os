import { describe, expect, it } from 'vitest'
import { computePayoutBreakdown, ROSTER_FEE_RATE } from './fees'

describe('computePayoutBreakdown', () => {
  it('bills the Roster fee to the brand and pays the creator in full', () => {
    const breakdown = computePayoutBreakdown(18000, 0.05)
    expect(breakdown.creatorAmount).toBe(18000)
    expect(breakdown.rosterFee).toBe(900)
    expect(breakdown.brandTotal).toBe(18900)
  })

  it('rounds the fee to a whole unit', () => {
    const breakdown = computePayoutBreakdown(12345, 0.05)
    expect(Number.isInteger(breakdown.rosterFee)).toBe(true)
    expect(breakdown.brandTotal).toBe(12345 + breakdown.rosterFee)
  })

  it('throws on a non-positive deal amount', () => {
    expect(() => computePayoutBreakdown(0)).toThrow()
  })

  it('exposes a sane default fee rate', () => {
    expect(ROSTER_FEE_RATE).toBeGreaterThan(0)
    expect(ROSTER_FEE_RATE).toBeLessThan(0.2)
  })
})
