import type { CreatorStats, MediaKitCopy, RateCard, Tier } from '../domain/types'

export interface KitRecord {
  slug: string
  stats: CreatorStats
  engagementRate: number
  tier: Tier
  rateCard: RateCard
  copy: MediaKitCopy
}

export interface KitRepository {
  saveKit(record: KitRecord): Promise<void>
  getKitBySlug(slug: string): Promise<KitRecord | null>
}
