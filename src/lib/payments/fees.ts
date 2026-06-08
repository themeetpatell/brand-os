// Roster's convenience fee is billed to the brand on top of the deal value, so the
// creator always receives her full rate. Roster never holds float — the licensed PA
// split-settles the creator portion and the Roster portion directly.
export const ROSTER_FEE_RATE = Number(process.env.ROSTER_FEE_RATE ?? '0.05')

export interface PayoutBreakdown {
  creatorAmount: number
  rosterFee: number
  brandTotal: number
}

export function computePayoutBreakdown(
  dealAmount: number,
  feeRate: number = ROSTER_FEE_RATE,
): PayoutBreakdown {
  if (dealAmount <= 0) {
    throw new Error('dealAmount must be positive')
  }
  const rosterFee = Math.round(dealAmount * feeRate)
  return {
    creatorAmount: dealAmount,
    rosterFee,
    brandTotal: dealAmount + rosterFee,
  }
}
