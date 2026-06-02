import { describe, expect, it } from 'vitest'
import { computeRateCard } from './rate-card'
import type { CreatorStats } from '../domain/types'

const inMicroFashion: CreatorStats = {
  handle: 'aanya.styles',
  displayName: 'Aanya',
  email: 'aanya@example.com',
  niche: 'fashion',
  region: 'IN',
  followerCount: 50000,
  avgLikes: 1400,
  avgComments: 100,
}

const aeNanoBeauty: CreatorStats = {
  handle: 'layla.glow',
  displayName: 'Layla',
  email: 'layla@example.com',
  niche: 'beauty',
  region: 'AE',
  followerCount: 8000,
  avgLikes: 600,
  avgComments: 40,
}

describe('computeRateCard', () => {
  it('computes INR bands for a micro fashion creator (ER 3.0%, x1.5)', () => {
    const card = computeRateCard(inMicroFashion)
    expect(card.currency).toBe('INR')
    expect(card.reel).toEqual({ min: 14000, max: 21100 })
    expect(card.story).toEqual({ min: 4300, max: 6500 })
    expect(card.carousel).toEqual({ min: 10800, max: 16200 })
    expect(card.bundle).toEqual({ min: 24300, max: 36500 })
  })

  it('computes AED bands for a nano beauty creator (ER 8.0%, x2.0 clamp)', () => {
    const card = computeRateCard(aeNanoBeauty)
    expect(card.currency).toBe('AED')
    expect(card.reel).toEqual({ min: 350, max: 525 })
    expect(card.story).toEqual({ min: 100, max: 150 })
    expect(card.carousel).toEqual({ min: 275, max: 400 })
    expect(card.bundle).toEqual({ min: 600, max: 900 })
  })
})
