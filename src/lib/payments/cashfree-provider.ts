import { createHmac, timingSafeEqual } from 'node:crypto'
import { computePayoutBreakdown } from './fees'
import type {
  PaymentsProvider,
  PaymentWebhookEvent,
  PayoutIntent,
  PayoutRequest,
  WebhookHeaders,
} from './provider'

interface CashfreeConfig {
  appId: string
  secretKey: string
  apiBase: string
  apiVersion: string
}

function readConfig(): CashfreeConfig {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  if (!appId || !secretKey) {
    throw new Error('Cashfree env vars are missing')
  }
  return {
    appId,
    secretKey,
    apiBase: process.env.CASHFREE_API_BASE ?? 'https://sandbox.cashfree.com/pg',
    apiVersion: process.env.CASHFREE_API_VERSION ?? '2023-08-01',
  }
}

// Cashfree Easy Split impl. Roster never holds float: the order is split between the
// creator (full deal amount) and Roster (the fee) at settlement time.
//
// NOTE: webhook signing and the split-order payload must be validated against the
// current Cashfree docs before go-live (sandbox first). Structure is faithful; exact
// field names may need a version bump.
export class CashfreePaymentsProvider implements PaymentsProvider {
  private readonly config: CashfreeConfig

  constructor(config: CashfreeConfig = readConfig()) {
    this.config = config
  }

  async createSplitPayout(request: PayoutRequest): Promise<PayoutIntent> {
    const breakdown = computePayoutBreakdown(request.amount)
    const res = await fetch(`${this.config.apiBase}/orders`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-client-id': this.config.appId,
        'x-client-secret': this.config.secretKey,
        'x-api-version': this.config.apiVersion,
      },
      body: JSON.stringify({
        order_id: request.dealId,
        order_amount: breakdown.brandTotal,
        order_currency: request.currency,
        customer_details: { customer_id: request.creatorId },
        order_splits: request.creatorPayoutRef
          ? [{ vendor_id: request.creatorPayoutRef, amount: breakdown.creatorAmount }]
          : undefined,
      }),
    })
    if (!res.ok) {
      throw new Error(`Cashfree createSplitPayout failed: ${res.status}`)
    }
    const data = (await res.json()) as { payment_session_id?: string }
    return {
      providerRef: request.dealId,
      status: 'created',
      checkoutUrl: data.payment_session_id,
    }
  }

  verifyWebhook(rawBody: string, headers: WebhookHeaders): PaymentWebhookEvent | null {
    const signature = headers['x-webhook-signature']
    const timestamp = headers['x-webhook-timestamp']
    if (!signature || !timestamp) {
      return null
    }
    const expected = createHmac('sha256', this.config.secretKey)
      .update(timestamp + rawBody)
      .digest('base64')
    if (!safeEqual(signature, expected)) {
      return null
    }

    try {
      const event = JSON.parse(rawBody) as {
        type?: string
        data?: { order?: { order_id?: string } }
      }
      const dealId = event.data?.order?.order_id
      if (!dealId) return null
      const status = event.type === 'PAYMENT_SUCCESS_WEBHOOK' ? 'paid' : 'failed'
      return { dealId, status, providerRef: dealId }
    } catch {
      return null
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
