import { z } from 'zod'

export const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'] as const
export const REGIONS = ['IN', 'AE'] as const
export const TIERS = ['nano', 'micro', 'mid', 'macro'] as const
export const CURRENCIES = ['INR', 'AED'] as const
export const DEAL_STATUSES = ['offered', 'accepted', 'delivered', 'paid'] as const

export type Niche = (typeof NICHES)[number]
export type Region = (typeof REGIONS)[number]
export type Tier = (typeof TIERS)[number]
export type Currency = (typeof CURRENCIES)[number]
export type DealStatus = (typeof DEAL_STATUSES)[number]

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
  currency: Currency
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

// A brand offer a creator logs into Roster — the consented transacted-rate datapoint.
export const DealInputSchema = z.object({
  brandName: z.string().min(1).max(120),
  deliverables: z.array(z.string().min(1)).min(1).max(20),
  amount: z.number().positive(),
  currency: z.enum(CURRENCIES),
})
export type DealInput = z.infer<typeof DealInputSchema>

export const BRIEF_STATUSES = ['open', 'closed', 'filled'] as const
export type BriefStatus = (typeof BRIEF_STATUSES)[number]

export const BriefInputSchema = z
  .object({
    title: z.string().min(1).max(120),
    goal: z.string().min(1).max(500),
    budgetMin: z.number().positive(),
    budgetMax: z.number().positive(),
    currency: z.enum(CURRENCIES),
    niche: z.enum(NICHES),
    region: z.enum(REGIONS),
    deliverables: z.array(z.string().min(1)).min(1).max(20),
  })
  .refine((b) => b.budgetMax >= b.budgetMin, {
    message: 'budgetMax must be >= budgetMin',
    path: ['budgetMax'],
  })
export type BriefInput = z.infer<typeof BriefInputSchema>

export const APPLICATION_STATUSES = ['applied', 'accepted', 'declined', 'withdrawn'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const ApplicationInputSchema = z.object({
  quoteAmount: z.number().positive(),
  message: z.string().min(1).max(600),
})
export type ApplicationInput = z.infer<typeof ApplicationInputSchema>

export const CreatorProfileSchema = z.object({
  niche: z.enum(NICHES),
  region: z.enum(REGIONS),
  rateFloor: z.number().positive(),
})
export type CreatorProfile = z.infer<typeof CreatorProfileSchema>
