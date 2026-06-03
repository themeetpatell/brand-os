import type { KitRecord, KitRepository } from './kit-repository'

export class InMemoryKitRepository implements KitRepository {
  private readonly store = new Map<string, KitRecord>()

  async saveKit(record: KitRecord): Promise<void> {
    this.store.set(record.slug, record)
  }

  async getKitBySlug(slug: string): Promise<KitRecord | null> {
    return this.store.get(slug) ?? null
  }
}
