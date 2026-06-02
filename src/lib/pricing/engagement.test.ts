import { describe, expect, it } from 'vitest'
import { computeEngagementRate } from './engagement'

describe('computeEngagementRate', () => {
  it('returns (likes+comments)/followers as a percentage, 2dp', () => {
    expect(computeEngagementRate(50000, 1400, 100)).toBe(3.0)
  })

  it('rounds to two decimals', () => {
    expect(computeEngagementRate(8000, 600, 40)).toBe(8.0)
    expect(computeEngagementRate(3333, 100, 0)).toBe(3.0)
  })

  it('throws on non-positive followers', () => {
    expect(() => computeEngagementRate(0, 10, 1)).toThrow()
  })
})
