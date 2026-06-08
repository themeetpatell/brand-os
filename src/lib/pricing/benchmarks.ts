import type { Niche, Region, Tier } from '../domain/types'

// Base single in-feed post rate in local currency, by region and tier.
const REGION_TIER_BASE: Record<Region, Record<Tier, number>> = {
  IN: { nano: 1500, micro: 9000, mid: 45000, macro: 150000 },
  AE: { nano: 150, micro: 700, mid: 3000, macro: 9000 },
}

const NICHE_FACTOR: Record<Niche, number> = {
  fashion: 1.0,
  beauty: 1.1,
  fitness: 0.9,
  food: 0.85,
  lifestyle: 0.95,
  tech: 1.2,
}

// Typical engagement % per tier, used as the multiplier baseline.
export const TYPICAL_ENGAGEMENT: Record<Tier, number> = {
  nano: 4.0,
  micro: 2.0,
  mid: 1.4,
  macro: 1.0,
}

export function currencyForRegion(region: Region): 'INR' | 'AED' {
  return region === 'IN' ? 'INR' : 'AED'
}

export function getBasePostRate(region: Region, niche: Niche, tier: Tier): number {
  return REGION_TIER_BASE[region][tier] * NICHE_FACTOR[niche]
}
