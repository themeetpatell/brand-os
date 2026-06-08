import { generateObject } from 'ai'
import { z } from 'zod'
import type { CreatorStats, MediaKitCopy, Niche, Tier } from '../domain/types'

export const MediaKitCopySchema = z.object({
  headline: z.string().min(1).max(120),
  bio: z.string().min(1).max(400),
  audienceSummary: z.string().min(1).max(300),
  brandFitCategories: z.array(z.string().min(1)).min(1).max(8),
  highlights: z.array(z.string().min(1)).min(1).max(6),
})

export interface CopyInput extends CreatorStats {
  engagementRate: number
  tier: Tier
}

export type CopyGenerator = (input: CopyInput) => Promise<MediaKitCopy>

// Default model goes through the Vercel AI Gateway (provider/model string).
const MODEL = process.env.MEDIA_KIT_MODEL ?? 'anthropic/claude-haiku-4.5'

const NICHE_BRAND_FIT: Record<Niche, string[]> = {
  fashion: ['fashion', 'apparel', 'accessories'],
  beauty: ['beauty', 'skincare', 'cosmetics'],
  fitness: ['fitness', 'activewear', 'wellness'],
  food: ['food', 'beverage', 'restaurants'],
  lifestyle: ['lifestyle', 'home', 'travel'],
  tech: ['tech', 'gadgets', 'apps'],
}

// Deterministic, stats-grounded copy used when the model call is unavailable.
export function buildFallbackMediaKitCopy(input: CopyInput): MediaKitCopy {
  const regionLabel = input.region === 'IN' ? 'India' : 'the UAE'
  const followers = input.followerCount.toLocaleString()
  return {
    headline: `${input.displayName} — ${input.niche} creator`,
    bio: `${input.displayName} is a ${regionLabel}-based ${input.niche} creator with ${followers} followers and ${input.engagementRate}% average engagement.`,
    audienceSummary: `Engaged ${input.niche} audience in ${regionLabel}, averaging ${input.engagementRate}% engagement across recent posts.`,
    brandFitCategories: NICHE_BRAND_FIT[input.niche],
    highlights: [
      `${followers} followers`,
      `${input.engagementRate}% average engagement`,
      `${input.tier}-tier ${input.niche} creator`,
    ],
  }
}

export const generateMediaKitCopy: CopyGenerator = async (input) => {
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: MediaKitCopySchema,
      prompt: [
        'Write a concise, professional influencer media-kit for a brand audience.',
        `Handle: @${input.handle}`,
        `Name: ${input.displayName}`,
        `Niche: ${input.niche}. Region: ${input.region}. Tier: ${input.tier}.`,
        `Followers: ${input.followerCount}. Engagement rate: ${input.engagementRate}%.`,
        'Keep claims grounded in these numbers. No emojis in the bio.',
      ].join('\n'),
    })
    return object
  } catch (error) {
    console.error('AI copy generation failed, using deterministic fallback', error)
    return buildFallbackMediaKitCopy(input)
  }
}
