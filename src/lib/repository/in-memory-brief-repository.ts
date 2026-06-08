import type { Brief, BriefRepository } from './brief-repository'

export class InMemoryBriefRepository implements BriefRepository {
  private readonly store = new Map<string, Brief>()

  async saveBrief(brief: Brief): Promise<void> {
    this.store.set(brief.id, brief)
  }

  async getBriefById(id: string): Promise<Brief | null> {
    return this.store.get(id) ?? null
  }

  async listBriefsByBrand(brandId: string): Promise<Brief[]> {
    return [...this.store.values()].filter((b) => b.brandId === brandId)
  }

  async listOpenBriefs(): Promise<Brief[]> {
    return [...this.store.values()].filter((b) => b.status === 'open')
  }
}
