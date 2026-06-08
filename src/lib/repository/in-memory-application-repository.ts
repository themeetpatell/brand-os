import type { Application, ApplicationRepository } from './application-repository'

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly store = new Map<string, Application>()

  async saveApplication(app: Application): Promise<void> {
    this.store.set(app.id, app)
  }
  async getApplicationById(id: string): Promise<Application | null> {
    return this.store.get(id) ?? null
  }
  async listApplicationsByBrief(briefId: string): Promise<Application[]> {
    return [...this.store.values()].filter((a) => a.briefId === briefId)
  }
  async findApplication(briefId: string, creatorId: string): Promise<Application | null> {
    return [...this.store.values()].find((a) => a.briefId === briefId && a.creatorId === creatorId) ?? null
  }
}
