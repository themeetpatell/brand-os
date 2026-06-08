import type { Band, CreatorStats, RateCard } from '../domain/types'
import { computeEngagementRate } from './engagement'
import { classifyTier } from './tier'
import { currencyForRegion, getBasePostRate, TYPICAL_ENGAGEMENT } from './benchmarks'

const DELIVERABLE = { reel: 1.3, carousel: 1.0, story: 0.4 } as const
const BAND_SPREAD = 0.2
const ENGAGEMENT_MULTIPLIER_MIN = 0.6
const ENGAGEMENT_MULTIPLIER_MAX = 2.0
const BUNDLE_DISCOUNT = 0.9

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function bandFromPoint(point: number, step: number): Band {
  const round = (v: number) => Math.round(v / step) * step
  return {
    min: round(point * (1 - BAND_SPREAD)),
    max: round(point * (1 + BAND_SPREAD)),
  }
}

export function computeRateCard(stats: CreatorStats): RateCard {
  const engagementRate = computeEngagementRate(
    stats.followerCount,
    stats.avgLikes,
    stats.avgComments,
  )
  const tier = classifyTier(stats.followerCount)
  const base = getBasePostRate(stats.region, stats.niche, tier)

  const multiplier = clamp(
    engagementRate / TYPICAL_ENGAGEMENT[tier],
    ENGAGEMENT_MULTIPLIER_MIN,
    ENGAGEMENT_MULTIPLIER_MAX,
  )
  const adjustedBase = base * multiplier

  const reelPoint = adjustedBase * DELIVERABLE.reel
  const storyPoint = adjustedBase * DELIVERABLE.story
  const carouselPoint = adjustedBase * DELIVERABLE.carousel
  const bundlePoint = (reelPoint + 3 * storyPoint) * BUNDLE_DISCOUNT

  const currency = currencyForRegion(stats.region)
  const step = currency === 'INR' ? 100 : 25

  return {
    currency,
    reel: bandFromPoint(reelPoint, step),
    story: bandFromPoint(storyPoint, step),
    carousel: bandFromPoint(carouselPoint, step),
    bundle: bandFromPoint(bundlePoint, step),
  }
}
