import type { DealInput, DealStatus } from '../domain/types'

export interface Deal extends DealInput {
  id: string
  creatorId: string
  status: DealStatus
  offeredAt: string
  paidAt: string | null
}

export interface DealRepository {
  saveDeal(deal: Deal): Promise<void>
  getDealById(id: string): Promise<Deal | null>
  listDealsByCreator(creatorId: string): Promise<Deal[]>
}
