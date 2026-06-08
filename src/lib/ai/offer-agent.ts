import { generateObject } from 'ai'
import { z } from 'zod'
import type { DealInput } from '../domain/types'

export const OfferAssessmentSchema = z.object({
  recommendation: z.enum(['accept', 'counter', 'decline']),
  counterAmount: z.number().nullable(),
  reason: z.string().min(1).max(300),
  draftReply: z.string().min(1).max(800),
})
export type OfferAssessment = z.infer<typeof OfferAssessmentSchema>

export interface OfferAssessmentInput {
  displayName: string
  // The creator's minimum acceptable total for this offer (her rate floor).
  floor: number
  offer: DealInput
}

export type OfferAssessor = (input: OfferAssessmentInput) => Promise<OfferAssessment>

// Offers at or above this fraction of the floor are worth countering rather than
// declining outright; below it the offer is too far off to engage.
export const COUNTER_THRESHOLD = 0.7

const MODEL = process.env.MEDIA_KIT_MODEL ?? 'anthropic/claude-haiku-4.5'

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString()}`
}

// Deterministic, floor-grounded assessment used when the model call is unavailable.
export function assessOfferDeterministic(input: OfferAssessmentInput): OfferAssessment {
  const { offer, floor, displayName } = input
  const deliverables = offer.deliverables.join(' + ')
  const floorLabel = formatMoney(offer.currency, floor)

  if (offer.amount >= floor) {
    return {
      recommendation: 'accept',
      counterAmount: null,
      reason: `Offer meets your floor of ${floorLabel} for ${deliverables}.`,
      draftReply: `Hi ${offer.brandName} team — thanks for reaching out! ${formatMoney(offer.currency, offer.amount)} for ${deliverables} works for me. Happy to lock in dates and share next steps. — ${displayName}`,
    }
  }

  if (offer.amount >= floor * COUNTER_THRESHOLD) {
    return {
      recommendation: 'counter',
      counterAmount: floor,
      reason: `Close, but below your floor of ${floorLabel} for ${deliverables}.`,
      draftReply: `Hi ${offer.brandName} team — I'd love to collaborate! For ${deliverables} my rate is ${floorLabel}. If that works, I can get started right away. — ${displayName}`,
    }
  }

  return {
    recommendation: 'decline',
    counterAmount: null,
    reason: `Offer is well under your floor of ${floorLabel} for ${deliverables}.`,
    draftReply: `Hi ${offer.brandName} team — thank you for thinking of me! This one is a bit below my current rate for ${deliverables}, so I'll have to pass for now, but I'd welcome future collaborations. — ${displayName}`,
  }
}

// AI assessment via the Vercel AI Gateway, with a deterministic fallback so the
// agent never hard-fails (mirrors generateMediaKitCopy).
export const assessOffer: OfferAssessor = async (input) => {
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: OfferAssessmentSchema,
      prompt: [
        "You are an influencer's deal manager. Assess this brand offer against her rate floor and recommend accept, counter, or decline.",
        `Creator: ${input.displayName}`,
        `Brand: ${input.offer.brandName}`,
        `Deliverables: ${input.offer.deliverables.join(', ')}`,
        `Offer amount: ${formatMoney(input.offer.currency, input.offer.amount)}`,
        `Her rate floor for this scope: ${formatMoney(input.offer.currency, input.floor)}`,
        'Never recommend accepting below the floor. If countering, set counterAmount to the floor. Draft a warm, professional reply she can send as-is. No emojis.',
      ].join('\n'),
    })
    return object
  } catch (error) {
    console.error('offer assessment failed, using deterministic fallback', error)
    return assessOfferDeterministic(input)
  }
}
