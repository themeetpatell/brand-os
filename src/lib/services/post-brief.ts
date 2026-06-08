import { nanoid } from 'nanoid'
import { BriefInputSchema } from '../domain/types'
import type { Brief, BriefRepository } from '../repository/brief-repository'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface PostBriefDeps {
  repo: BriefRepository
  idGen?: IdGenerator
  now?: Clock
}

export async function postBrief(
  brandId: string,
  body: unknown,
  deps: PostBriefDeps,
): Promise<Brief> {
  if (!brandId) {
    throw new Error('brandId is required')
  }
  const input = BriefInputSchema.parse(body)
  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())

  const brief: Brief = {
    ...input,
    id: idGen(),
    brandId,
    status: 'open',
    createdAt: now(),
  }
  await deps.repo.saveBrief(brief)
  return brief
}
