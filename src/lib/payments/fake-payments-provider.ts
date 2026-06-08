import type {
  PaymentsProvider,
  PaymentWebhookEvent,
  PayoutIntent,
  PayoutRequest,
  WebhookHeaders,
} from './provider'

// Dev/E2E provider: records intents and treats any JSON webhook body as authentic.
// Never use in production — it performs no signature verification and moves no money.
export class FakePaymentsProvider implements PaymentsProvider {
  readonly intents: PayoutRequest[] = []

  async createSplitPayout(request: PayoutRequest): Promise<PayoutIntent> {
    this.intents.push(request)
    return {
      providerRef: `fake_${request.dealId}`,
      status: 'created',
      checkoutUrl: `https://sandbox.local/pay/${request.dealId}`,
    }
  }

  verifyWebhook(rawBody: string, _headers: WebhookHeaders): PaymentWebhookEvent | null {
    try {
      const parsed = JSON.parse(rawBody) as Partial<PaymentWebhookEvent>
      if (!parsed.dealId || (parsed.status !== 'paid' && parsed.status !== 'failed')) {
        return null
      }
      return {
        dealId: parsed.dealId,
        status: parsed.status,
        providerRef: parsed.providerRef ?? `fake_${parsed.dealId}`,
      }
    } catch {
      return null
    }
  }
}
