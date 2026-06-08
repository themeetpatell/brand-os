import { CreatorStatsSchema } from '../domain/types'
import { computeEngagementRate } from '../pricing/engagement'
import { classifyTier } from '../pricing/tier'
import { computeRateCard } from '../pricing/rate-card'
import { makeSlug, type IdGenerator } from '../repository/slug'
import type { KitRecord, KitRepository } from '../repository/kit-repository'
import type { CopyGenerator } from '../ai/media-kit-copy'

export interface CreateKitDeps {
  repo: KitRepository
  generateCopy: CopyGenerator
  idGen?: IdGenerator
}

export async function createKit(
  body: unknown,
  deps: CreateKitDeps,
): Promise<{ slug: string }> {
  const stats = CreatorStatsSchema.parse(body)
  const engagementRate = computeEngagementRate(
    stats.followerCount,
    stats.avgLikes,
    stats.avgComments,
  )
  const tier = classifyTier(stats.followerCount)
  const rateCard = computeRateCard(stats)
  const copy = await deps.generateCopy({ ...stats, engagementRate, tier })
  const slug = makeSlug(stats.handle, deps.idGen)

  const record: KitRecord = { slug, stats, engagementRate, tier, rateCard, copy }
  await deps.repo.saveKit(record)
  return { slug }
}
