import { nanoid } from 'nanoid'
import { ApplicationInputSchema } from '../domain/types'
import type { Application, ApplicationRepository } from '../repository/application-repository'
import type { BriefRepository } from '../repository/brief-repository'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface ApplyDeps {
  appRepo: ApplicationRepository
  briefRepo: BriefRepository
  idGen?: IdGenerator
  now?: Clock
}

export async function applyToBrief(
  creatorId: string,
  briefId: string,
  body: unknown,
  deps: ApplyDeps,
): Promise<Application> {
  if (!creatorId) throw new Error('creatorId is required')
  const input = ApplicationInputSchema.parse(body)

  const brief = await deps.briefRepo.getBriefById(briefId)
  if (!brief || brief.status !== 'open') throw new Error('brief is not open')

  const existing = await deps.appRepo.findApplication(briefId, creatorId)
  if (existing) throw new Error('already applied to this brief')

  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())
  const app: Application = {
    ...input,
    id: idGen(),
    briefId,
    creatorId,
    currency: brief.currency,
    status: 'applied',
    createdAt: now(),
  }
  await deps.appRepo.saveApplication(app)
  return app
}
