import type { SupabaseClient } from '@supabase/supabase-js'
import type { Currency, BriefStatus, Niche, Region } from '../domain/types'
import type { Brief, BriefRepository } from './brief-repository'

interface BriefRow {
  id: string
  brand_id: string
  title: string
  goal: string
  budget_min: number | string
  budget_max: number | string
  currency: string
  niche: string
  region: string
  deliverables: string[]
  status: string
  created_at: string
}

function toBrief(row: BriefRow): Brief {
  return {
    id: row.id,
    brandId: row.brand_id,
    title: row.title,
    goal: row.goal,
    budgetMin: Number(row.budget_min),
    budgetMax: Number(row.budget_max),
    currency: row.currency as Currency,
    niche: row.niche as Niche,
    region: row.region as Region,
    deliverables: row.deliverables,
    status: row.status as BriefStatus,
    createdAt: row.created_at,
  }
}

export class SupabaseBriefRepository implements BriefRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveBrief(brief: Brief): Promise<void> {
    const { error } = await this.client.from('briefs').upsert({
      id: brief.id,
      brand_id: brief.brandId,
      title: brief.title,
      goal: brief.goal,
      budget_min: brief.budgetMin,
      budget_max: brief.budgetMax,
      currency: brief.currency,
      niche: brief.niche,
      region: brief.region,
      deliverables: brief.deliverables,
      status: brief.status,
      created_at: brief.createdAt,
    })
    if (error) throw new Error(`saveBrief failed: ${error.message}`)
  }

  async getBriefById(id: string): Promise<Brief | null> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('id', id)
      .maybeSingle<BriefRow>()
    if (error) throw new Error(`getBriefById failed: ${error.message}`)
    return data ? toBrief(data) : null
  }

  async listBriefsByBrand(brandId: string): Promise<Brief[]> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .returns<BriefRow[]>()
    if (error) throw new Error(`listBriefsByBrand failed: ${error.message}`)
    return (data ?? []).map(toBrief)
  }

  async listOpenBriefs(): Promise<Brief[]> {
    const { data, error } = await this.client
      .from('briefs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .returns<BriefRow[]>()
    if (error) throw new Error(`listOpenBriefs failed: ${error.message}`)
    return (data ?? []).map(toBrief)
  }
}
