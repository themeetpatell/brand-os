import type { BriefInput, BriefStatus } from '../domain/types'

export interface Brief extends BriefInput {
  id: string
  brandId: string
  status: BriefStatus
  createdAt: string
}

export interface BriefRepository {
  saveBrief(brief: Brief): Promise<void>
  getBriefById(id: string): Promise<Brief | null>
  listBriefsByBrand(brandId: string): Promise<Brief[]>
  listOpenBriefs(): Promise<Brief[]>
}
