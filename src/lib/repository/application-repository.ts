import type { ApplicationInput, ApplicationStatus, Currency } from '../domain/types'

export interface Application extends ApplicationInput {
  id: string
  briefId: string
  creatorId: string
  currency: Currency
  status: ApplicationStatus
  createdAt: string
}

export interface ApplicationRepository {
  saveApplication(app: Application): Promise<void>
  getApplicationById(id: string): Promise<Application | null>
  listApplicationsByBrief(briefId: string): Promise<Application[]>
  findApplication(briefId: string, creatorId: string): Promise<Application | null>
}
