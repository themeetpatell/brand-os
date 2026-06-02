import type { Tier } from '../domain/types'

export function classifyTier(followerCount: number): Tier {
  if (followerCount < 10000) return 'nano'
  if (followerCount < 100000) return 'micro'
  if (followerCount < 500000) return 'mid'
  return 'macro'
}
