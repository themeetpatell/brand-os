import { generateObject } from 'ai'
import { z } from 'zod'
import type { CreatorStats, MediaKitCopy, Tier } from '../domain/types'

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

export const generateMediaKitCopy: CopyGenerator = async (input) => {
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
}
