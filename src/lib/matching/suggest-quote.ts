// The agent's suggested quote: the creator's floor, clamped into the brief budget.
export function suggestQuote(floor: number | null, budgetMin: number, budgetMax: number): number {
  const base = floor ?? budgetMin
  return Math.min(Math.max(base, budgetMin), budgetMax)
}
