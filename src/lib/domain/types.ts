import { z } from 'zod'

export const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'] as const
export const REGIONS = ['IN', 'AE'] as const
export const TIERS = ['nano', 'micro', 'mid', 'macro'] as const

export type Niche = (typeof NICHES)[number]
export type Region = (typeof REGIONS)[number]
export type Tier = (typeof TIERS)[number]

export const CreatorStatsSchema = z.object({
  handle: z.string().min(1).max(60),
  displayName: z.string().min(1).max(80),
  email: z.string().email(),
  niche: z.enum(NICHES),
  region: z.enum(REGIONS),
  followerCount: z.number().int().positive(),
  avgLikes: z.number().int().nonnegative(),
  avgComments: z.number().int().nonnegative(),
})
export type CreatorStats = z.infer<typeof CreatorStatsSchema>

export interface Band {
  min: number
  max: number
}

export interface RateCard {
  currency: 'INR' | 'AED'
  reel: Band
  story: Band
  carousel: Band
  bundle: Band
}

export interface MediaKitCopy {
  headline: string
  bio: string
  audienceSummary: string
  brandFitCategories: string[]
  highlights: string[]
}
