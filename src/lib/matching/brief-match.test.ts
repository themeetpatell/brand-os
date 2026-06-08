import { describe, expect, it } from 'vitest'
import { creatorMatchesBrief } from './brief-match'
import type { CreatorMatchProfile, BriefMatchFields } from './brief-match'

const creator: CreatorMatchProfile = { niche: 'beauty', region: 'IN', rateFloor: 10000 }
const brief: BriefMatchFields = { niche: 'beauty', region: 'IN', budgetMax: 25000, status: 'open' }

describe('creatorMatchesBrief', () => {
  it('matches same niche + region when budget covers the floor', () => {
    expect(creatorMatchesBrief(creator, brief)).toBe(true)
  })

  it('rejects a different niche', () => {
    expect(creatorMatchesBrief(creator, { ...brief, niche: 'fashion' })).toBe(false)
  })

  it('rejects a different region', () => {
    expect(creatorMatchesBrief(creator, { ...brief, region: 'AE' })).toBe(false)
  })

  it('rejects when the budget cannot cover the floor', () => {
    expect(creatorMatchesBrief(creator, { ...brief, budgetMax: 9000 })).toBe(false)
  })

  it('rejects a non-open brief', () => {
    expect(creatorMatchesBrief(creator, { ...brief, status: 'filled' })).toBe(false)
  })

  it('matches when the creator has no floor set', () => {
    expect(creatorMatchesBrief({ ...creator, rateFloor: null }, { ...brief, budgetMax: 1 })).toBe(true)
  })
})
