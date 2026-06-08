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
  // Unscoped fetch — only for trusted server paths (e.g. signed webhook settlement).
  getDealById(id: string): Promise<Deal | null>
  // Ownership-scoped fetch — use for any creator-initiated action (no fetch-then-check).
  getDealByIdForCreator(id: string, creatorId: string): Promise<Deal | null>
  listDealsByCreator(creatorId: string): Promise<Deal[]>
}
