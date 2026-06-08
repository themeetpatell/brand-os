import { describe, expect, it } from 'vitest'
import { getBasePostRate, currencyForRegion } from './benchmarks'

describe('benchmarks', () => {
  it('maps region to currency', () => {
    expect(currencyForRegion('IN')).toBe('INR')
    expect(currencyForRegion('AE')).toBe('AED')
  })

  it('returns base post rate = regionTierBase * nicheFactor', () => {
    // IN micro base 9000 * fashion 1.0
    expect(getBasePostRate('IN', 'fashion', 'micro')).toBe(9000)
    // IN micro base 9000 * beauty 1.1
    expect(getBasePostRate('IN', 'beauty', 'micro')).toBe(9900)
    // AE nano base 150 * beauty 1.1
    expect(getBasePostRate('AE', 'beauty', 'nano')).toBe(165)
  })
})
