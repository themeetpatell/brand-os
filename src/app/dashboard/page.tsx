'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBrowserClient } from '../../lib/supabase/browser-client'
import { AppHeader } from '../../components/AppHeader'

interface Deal {
  id: string
  brandName: string
  deliverables: string[]
  amount: number
  currency: 'INR' | 'AED'
  status: 'offered' | 'accepted' | 'delivered' | 'paid'
}

const inputClass =
  'w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-marigold'

const STATUS_STYLES: Record<Deal['status'], string> = {
  offered: 'border-line bg-paper-2 text-ink-soft',
  accepted: 'border-ink/15 bg-ink/5 text-ink',
  delivered: 'border-marigold/40 bg-marigold/10 text-marigold-deep',
  paid: 'border-positive/30 bg-positive/10 text-positive',
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [error, setError] = useState<string | null>(null)

  const authFetch = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(path, {
        ...init,
        headers: { ...init.headers, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      }),
    [token],
  )

  const loadDeals = useCallback(async () => {
    const res = await authFetch('/api/deals')
    if (res.ok) setDeals((await res.json()).deals)
  }, [authFetch])

  useEffect(() => {
    const supabase = getBrowserClient()
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        window.location.href = '/login'
        return
      }
      setToken(session.access_token)
      const user = session.user
      const handle = (user.email ?? 'creator').split('@')[0]
      await supabase
        .from('creators')
        .upsert(
          { id: user.id, handle, display_name: handle, email: user.email },
          { onConflict: 'id', ignoreDuplicates: true },
        )
    })
  }, [])

  useEffect(() => {
    if (token) loadDeals()
  }, [token, loadDeals])

  async function logDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      brandName: String(form.get('brandName')),
      deliverables: String(form.get('deliverables'))
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      amount: Number(form.get('amount')),
      currency: String(form.get('currency')),
    }
    const res = await authFetch('/api/deals', { method: 'POST', body: JSON.stringify(payload) })
    if (!res.ok) {
      setError('Could not log the deal. Check your inputs.')
      return
    }
    event.currentTarget.reset()
    await loadDeals()
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await authFetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        niche: String(form.get('niche')),
        region: String(form.get('region')),
        rateFloor: Number(form.get('rateFloor')),
      }),
    })
  }

  async function getPaid(dealId: string) {
    const res = await authFetch('/api/payments', { method: 'POST', body: JSON.stringify({ dealId }) })
    if (!res.ok) {
      setError('Could not start the payout.')
      return
    }
    const intent = await res.json()
    if (intent.checkoutUrl) window.open(intent.checkoutUrl, '_blank')
  }

  const gmvRouted = deals.filter((d) => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0)
  const paidCount = deals.filter((d) => d.status === 'paid').length

  return (
    <div className="min-h-full">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="kicker">Your business, at a glance</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-ink">Cockpit</h1>

        {/* Metrics */}
        <section className="mt-8 grid grid-cols-3 gap-4" data-testid="metrics">
          <Metric label="Deals logged" value={String(deals.length)} />
          <Metric label="GMV routed" value={gmvRouted.toLocaleString()} accent />
          <Metric label="Paid" value={String(paidCount)} />
        </section>

        <section className="mt-8 rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold text-ink">Your profile</h2>
          <p className="mt-1 text-sm text-ink-soft">Set these so brands can match you with briefs.</p>
          <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="profile-form">
            <select name="niche" className={inputClass} defaultValue="beauty">
              {['fashion','beauty','fitness','food','lifestyle','tech'].map((n) => (<option key={n} value={n}>{n[0].toUpperCase()+n.slice(1)}</option>))}
            </select>
            <select name="region" className={inputClass} defaultValue="IN">
              <option value="IN">India</option><option value="AE">UAE</option>
            </select>
            <input name="rateFloor" type="number" min={1} required placeholder="Rate floor" className={inputClass} />
            <button type="submit" className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper sm:col-span-3 sm:w-fit">Save profile</button>
          </form>
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Log a deal */}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Log a brand offer</h2>
            <p className="mt-1 text-sm text-ink-soft">Every logged deal sharpens your rates.</p>
            <form onSubmit={logDeal} className="mt-5 space-y-3" data-testid="deal-form">
              <input name="brandName" required placeholder="Brand name" className={inputClass} />
              <input name="deliverables" required placeholder="Deliverables (comma separated)" className={inputClass} />
              <div className="flex gap-3">
                <input name="amount" type="number" min={1} required placeholder="Amount" className={inputClass} />
                <select name="currency" className="rounded-[12px] border border-line bg-card px-3 py-2.5 text-ink">
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              {error && (
                <p className="rounded-[12px] border border-clay/30 bg-clay/5 px-4 py-2.5 text-sm text-clay" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper transition-transform duration-200 hover:-translate-y-0.5"
              >
                Log deal
              </button>
            </form>
          </section>

          {/* Deals ledger */}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Deals</h2>
            <div className="mt-5 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-card shadow-soft">
              {deals.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-ink-faint">
                  No deals yet — log your first brand offer to start the ledger.
                </p>
              ) : (
                <table className="w-full text-left text-sm" data-testid="deals">
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.id} className="border-b border-line/60 last:border-0" data-deal-id={deal.id}>
                        <td className="py-4 pl-6 pr-3">
                          <div className="font-medium text-ink">{deal.brandName}</div>
                          <div className="mt-0.5 text-xs text-ink-faint">{deal.deliverables.join(', ')}</div>
                        </td>
                        <td className="tnum whitespace-nowrap py-4 pr-3 text-ink">
                          {deal.currency} {deal.amount.toLocaleString()}
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            data-testid="deal-status"
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[deal.status]}`}
                          >
                            {deal.status}
                          </span>
                        </td>
                        <td className="py-4 pr-6 text-right">
                          {deal.status !== 'paid' && (
                            <button
                              onClick={() => getPaid(deal.id)}
                              className="rounded-full border border-marigold/50 px-3.5 py-1.5 text-xs font-medium text-marigold-deep transition-colors hover:bg-marigold hover:text-ink"
                            >
                              Get paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-5 shadow-soft ${
        accent ? 'border-marigold/30 bg-marigold/10' : 'border-line bg-card'
      }`}
    >
      <div className="font-display tnum text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </div>
  )
}
