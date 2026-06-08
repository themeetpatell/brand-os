import { NextResponse } from 'next/server'
import { getPaymentsProvider, getServerDeps } from '../../../../lib/server/deps'
import { markDealPaid } from '../../../../lib/services/mark-paid'

// Payment-aggregator webhook: verify signature, then settle the deal. Roster holds
// no float — this only records that the PA split-settled the creator and the fee.
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()
  const headers = {
    'x-webhook-signature': request.headers.get('x-webhook-signature') ?? undefined,
    'x-webhook-timestamp': request.headers.get('x-webhook-timestamp') ?? undefined,
  }

  const event = getPaymentsProvider().verifyWebhook(rawBody, headers)
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.status === 'paid') {
    try {
      const deps = getServerDeps()
      await markDealPaid(event.dealId, { repo: deps.dealRepo, events: deps.events })
    } catch (error) {
      console.error('webhook settle failed', error)
      return NextResponse.json({ error: 'Processing error' }, { status: 500 })
    }
  }
  return NextResponse.json({ received: true }, { status: 200 })
}
