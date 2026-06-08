import { nanoid } from 'nanoid'
import type { ApplicationRepository } from '../repository/application-repository'
import type { BriefRepository } from '../repository/brief-repository'
import type { Deal, DealRepository } from '../repository/deal-repository'
import type { EventSink } from '../events/event-sink'
import type { IdGenerator } from '../repository/slug'
import type { Clock } from './log-deal'

export interface AcceptDeps {
  appRepo: ApplicationRepository
  briefRepo: BriefRepository
  dealRepo: DealRepository
  events?: EventSink
  idGen?: IdGenerator
  now?: Clock
}

export async function acceptApplication(
  brandId: string,
  applicationId: string,
  brandName: string,
  deps: AcceptDeps,
): Promise<Deal> {
  const app = await deps.appRepo.getApplicationById(applicationId)
  if (!app) throw new Error(`application not found: ${applicationId}`)

  const brief = await deps.briefRepo.getBriefById(app.briefId)
  if (!brief || brief.brandId !== brandId) throw new Error('not your brief')

  const idGen = deps.idGen ?? (() => nanoid())
  const now = deps.now ?? (() => new Date().toISOString())

  const deal: Deal = {
    id: idGen(),
    creatorId: app.creatorId,
    brandName,
    deliverables: brief.deliverables,
    amount: app.quoteAmount,
    currency: app.currency,
    status: 'accepted',
    offeredAt: now(),
    paidAt: null,
  }
  await deps.dealRepo.saveDeal(deal)
  await deps.appRepo.saveApplication({ ...app, status: 'accepted' })
  await deps.briefRepo.saveBrief({ ...brief, status: 'filled' })
  await deps.events?.record({
    creatorId: app.creatorId,
    type: 'application_accepted',
    payload: { dealId: deal.id, briefId: brief.id, applicationId },
    createdAt: now(),
  })
  return deal
}
