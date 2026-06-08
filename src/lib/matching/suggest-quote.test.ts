import { describe, expect, it } from 'vitest'
import { suggestQuote } from './suggest-quote'

describe('suggestQuote', () => {
  it('uses the floor when it sits inside the budget', () => {
    expect(suggestQuote(15000, 8000, 25000)).toBe(15000)
  })
  it('clamps up to the budget minimum when the floor is below it', () => {
    expect(suggestQuote(5000, 8000, 25000)).toBe(8000)
  })
  it('clamps down to the budget maximum when the floor exceeds it', () => {
    expect(suggestQuote(40000, 8000, 25000)).toBe(25000)
  })
  it('falls back to the budget minimum when there is no floor', () => {
    expect(suggestQuote(null, 8000, 25000)).toBe(8000)
  })
})
