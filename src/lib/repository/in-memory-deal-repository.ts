import type { Deal, DealRepository } from './deal-repository'

export class InMemoryDealRepository implements DealRepository {
  private readonly store = new Map<string, Deal>()

  async saveDeal(deal: Deal): Promise<void> {
    this.store.set(deal.id, deal)
  }

  async getDealById(id: string): Promise<Deal | null> {
    return this.store.get(id) ?? null
  }

  async listDealsByCreator(creatorId: string): Promise<Deal[]> {
    return [...this.store.values()].filter((deal) => deal.creatorId === creatorId)
  }
}
