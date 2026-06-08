import type { Currency } from '../domain/types'

export interface PayoutRequest {
  dealId: string
  creatorId: string
  // The deal value the creator receives in full; the Roster fee is added on top
  // for the brand (see computePayoutBreakdown).
  amount: number
  currency: Currency
  // Beneficiary/vendor id registered with the payment aggregator, if known.
  creatorPayoutRef?: string
}

export interface PayoutIntent {
  providerRef: string
  status: 'created' | 'paid' | 'failed'
  // Where the brand completes payment, when the PA returns a hosted link.
  checkoutUrl?: string
}

export interface PaymentWebhookEvent {
  dealId: string
  status: 'paid' | 'failed'
  providerRef: string
}

export type WebhookHeaders = Record<string, string | undefined>

// The swappable rails seam (mirrors KitRepository / OfferAssessor). Roster never
// custodies funds — the provider orchestrates a split settlement at a licensed PA.
export interface PaymentsProvider {
  createSplitPayout(request: PayoutRequest): Promise<PayoutIntent>
  verifyWebhook(rawBody: string, headers: WebhookHeaders): PaymentWebhookEvent | null
}
