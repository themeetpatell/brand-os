import { NextResponse } from 'next/server'
import { getCreatorIdFromRequest } from '../../../lib/auth/server'
import { getServerDeps } from '../../../lib/server/deps'

// Create a float-free split-payout intent for a deal the creator owns. The brand
// completes payment at the returned checkout URL; settlement flips the deal to paid
// via the webhook.
export async function POST(request: Request): Promise<Response> {
  const creatorId = await getCreatorIdFromRequest(request)
  if (!creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dealId?: string }
  try {
    body = (await request.json()) as { dealId?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.dealId) {
    return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
  }

  try {
    const deps = getServerDeps()
    const deal = await deps.dealRepo.getDealByIdForCreator(body.dealId, creatorId)
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const intent = await deps.payments.createSplitPayout({
      dealId: deal.id,
      creatorId,
      amount: deal.amount,
      currency: deal.currency,
    })
    await deps.events.record({
      creatorId,
      type: 'payout_initiated',
      payload: { dealId: deal.id, amount: deal.amount, currency: deal.currency },
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json(intent, { status: 200 })
  } catch (error) {
    console.error('create payout failed', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
