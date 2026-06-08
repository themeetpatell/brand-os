import type { SupabaseClient } from '@supabase/supabase-js'
import type { ApplicationStatus, Currency } from '../domain/types'
import type { Application, ApplicationRepository } from './application-repository'

interface AppRow {
  id: string
  brief_id: string
  creator_id: string
  quote_amount: number | string
  currency: string
  message: string
  status: string
  created_at: string
}

function toApp(row: AppRow): Application {
  return {
    id: row.id,
    briefId: row.brief_id,
    creatorId: row.creator_id,
    quoteAmount: Number(row.quote_amount),
    currency: row.currency as Currency,
    message: row.message,
    status: row.status as ApplicationStatus,
    createdAt: row.created_at,
  }
}

export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveApplication(app: Application): Promise<void> {
    const { error } = await this.client.from('applications').upsert({
      id: app.id,
      brief_id: app.briefId,
      creator_id: app.creatorId,
      quote_amount: app.quoteAmount,
      currency: app.currency,
      message: app.message,
      status: app.status,
      created_at: app.createdAt,
    })
    if (error) throw new Error(`saveApplication failed: ${error.message}`)
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('id', id)
      .maybeSingle<AppRow>()
    if (error) throw new Error(`getApplicationById failed: ${error.message}`)
    return data ? toApp(data) : null
  }

  async listApplicationsByBrief(briefId: string): Promise<Application[]> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: true })
      .returns<AppRow[]>()
    if (error) throw new Error(`listApplicationsByBrief failed: ${error.message}`)
    return (data ?? []).map(toApp)
  }

  async findApplication(briefId: string, creatorId: string): Promise<Application | null> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('brief_id', briefId)
      .eq('creator_id', creatorId)
      .maybeSingle<AppRow>()
    if (error) throw new Error(`findApplication failed: ${error.message}`)
    return data ? toApp(data) : null
  }
}
