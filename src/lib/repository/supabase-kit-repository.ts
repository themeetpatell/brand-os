import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreatorStats, RateCard, MediaKitCopy, Tier, Niche, Region } from '../domain/types'
import type { KitRecord, KitRepository } from './kit-repository'

export class SupabaseKitRepository implements KitRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveKit(record: KitRecord): Promise<void> {
    const { stats } = record
    const { error } = await this.client.from('media_kits').insert({
      slug: record.slug,
      handle: stats.handle,
      display_name: stats.displayName,
      email: stats.email,
      niche: stats.niche,
      region: stats.region,
      follower_count: stats.followerCount,
      avg_likes: stats.avgLikes,
      avg_comments: stats.avgComments,
      engagement_rate: record.engagementRate,
      tier: record.tier,
      currency: record.rateCard.currency,
      rate_card: record.rateCard,
      copy: record.copy,
    })
    if (error) throw new Error(`saveKit failed: ${error.message}`)
  }

  async getKitBySlug(slug: string): Promise<KitRecord | null> {
    const { data, error } = await this.client
      .from('media_kits')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw new Error(`getKitBySlug failed: ${error.message}`)
    if (!data) return null

    const stats: CreatorStats = {
      handle: data.handle,
      displayName: data.display_name,
      email: data.email,
      niche: data.niche as Niche,
      region: data.region as Region,
      followerCount: data.follower_count,
      avgLikes: data.avg_likes,
      avgComments: data.avg_comments,
    }
    return {
      slug: data.slug,
      stats,
      engagementRate: Number(data.engagement_rate),
      tier: data.tier as Tier,
      rateCard: data.rate_card as RateCard,
      copy: data.copy as MediaKitCopy,
    }
  }
}
