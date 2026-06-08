import type { Niche, Region, BriefStatus } from '../domain/types'

export interface CreatorMatchProfile {
  niche: Niche
  region: Region
  rateFloor: number | null
}

export interface BriefMatchFields {
  niche: Niche
  region: Region
  budgetMax: number
  status: BriefStatus
}

// A creator matches an OPEN brief in her niche+region whose budget can cover her floor.
export function creatorMatchesBrief(
  creator: CreatorMatchProfile,
  brief: BriefMatchFields,
): boolean {
  if (brief.status !== 'open') return false
  if (brief.niche !== creator.niche) return false
  if (brief.region !== creator.region) return false
  if (creator.rateFloor !== null && brief.budgetMax < creator.rateFloor) return false
  return true
}
