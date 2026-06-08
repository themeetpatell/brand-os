import type { SupabaseClient } from '@supabase/supabase-js'
import type { Currency, DealStatus } from '../domain/types'
import type { Deal, DealRepository } from './deal-repository'

interface DealRow {
  id: string
  creator_id: string
  brand_name: string
  deliverables: string[]
  amount: number | string
  currency: string
  status: string
  offered_at: string
  paid_at: string | null
}

function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    creatorId: row.creator_id,
    brandName: row.brand_name,
    deliverables: row.deliverables,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    status: row.status as DealStatus,
    offeredAt: row.offered_at,
    paidAt: row.paid_at,
  }
}

export class SupabaseDealRepository implements DealRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveDeal(deal: Deal): Promise<void> {
    const { error } = await this.client.from('deals').upsert({
      id: deal.id,
      creator_id: deal.creatorId,
      brand_name: deal.brandName,
      deliverables: deal.deliverables,
      amount: deal.amount,
      currency: deal.currency,
      status: deal.status,
      offered_at: deal.offeredAt,
      paid_at: deal.paidAt,
    })
    if (error) throw new Error(`saveDeal failed: ${error.message}`)
  }

  async getDealById(id: string): Promise<Deal | null> {
    const { data, error } = await this.client
      .from('deals')
      .select('*')
      .eq('id', id)
      .maybeSingle<DealRow>()
    if (error) throw new Error(`getDealById failed: ${error.message}`)
    return data ? toDeal(data) : null
  }

  async getDealByIdForCreator(id: string, creatorId: string): Promise<Deal | null> {
    const { data, error } = await this.client
      .from('deals')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creatorId)
      .maybeSingle<DealRow>()
    if (error) throw new Error(`getDealByIdForCreator failed: ${error.message}`)
    return data ? toDeal(data) : null
  }

  async listDealsByCreator(creatorId: string): Promise<Deal[]> {
    const { data, error } = await this.client
      .from('deals')
      .select('*')
      .eq('creator_id', creatorId)
      .order('offered_at', { ascending: false })
      .returns<DealRow[]>()
    if (error) throw new Error(`listDealsByCreator failed: ${error.message}`)
    return (data ?? []).map(toDeal)
  }
}
