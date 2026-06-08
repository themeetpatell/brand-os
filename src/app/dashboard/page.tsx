'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

interface Deal {
  id: string
  brandName: string
  deliverables: string[]
  amount: number
  currency: 'INR' | 'AED'
  status: 'offered' | 'accepted' | 'delivered' | 'paid'
}

export default function DashboardPage() {
  const router = useRouter()
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
        router.push('/login')
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
  }, [router])

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

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Your cockpit</h1>

      <section className="mt-4 grid grid-cols-3 gap-3 text-center" data-testid="metrics">
        <Metric label="Deals logged" value={String(deals.length)} />
        <Metric label="GMV routed" value={gmvRouted.toLocaleString()} />
        <Metric label="Paid" value={String(deals.filter((d) => d.status === 'paid').length)} />
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Log a brand offer</h2>
        <form onSubmit={logDeal} className="mt-3 space-y-3" data-testid="deal-form">
          <input name="brandName" required placeholder="brand name" className="w-full rounded border p-2" />
          <input name="deliverables" required placeholder="deliverables (comma separated)" className="w-full rounded border p-2" />
          <div className="flex gap-3">
            <input name="amount" type="number" min={1} required placeholder="amount" className="w-full rounded border p-2" />
            <select name="currency" className="rounded border p-2">
              <option value="INR">INR</option>
              <option value="AED">AED</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">Log deal</button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Deals</h2>
        <table className="mt-3 w-full text-left text-sm" data-testid="deals">
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id} className="border-b">
                <td className="py-2 font-medium">{deal.brandName}</td>
                <td className="py-2">{deal.currency} {deal.amount.toLocaleString()}</td>
                <td className="py-2 text-gray-500">{deal.status}</td>
                <td className="py-2 text-right">
                  {deal.status !== 'paid' && (
                    <button onClick={() => getPaid(deal.id)} className="rounded border px-3 py-1">Get paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-3">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
