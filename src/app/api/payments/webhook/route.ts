import { NextResponse } from 'next/server'
import { getServerDeps } from '../../../../lib/server/deps'
import { markDealPaid } from '../../../../lib/services/mark-paid'

// Payment-aggregator webhook: verify signature, then settle the deal. Roster holds
// no float — this only records that the PA split-settled the creator and the fee.
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()
  const headers = {
    'x-webhook-signature': request.headers.get('x-webhook-signature') ?? undefined,
    'x-webhook-timestamp': request.headers.get('x-webhook-timestamp') ?? undefined,
  }

  // Build deps once so the same provider verifies the signature and settles the deal.
  let deps
  try {
    deps = getServerDeps()
  } catch (error) {
    console.error('webhook deps init failed', error)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  const event = deps.payments.verifyWebhook(rawBody, headers)
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.status === 'paid') {
    try {
      await markDealPaid(event.dealId, { repo: deps.dealRepo, events: deps.events })
    } catch (error) {
      console.error('webhook settle failed', error)
      return NextResponse.json({ error: 'Processing error' }, { status: 500 })
    }
  }
  return NextResponse.json({ received: true }, { status: 200 })
}
