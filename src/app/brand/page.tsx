'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

interface Brief {
  id: string
  title: string
  budgetMin: number
  budgetMax: number
  currency: string
  niche: string
  region: string
  status: string
}

export default function BrandPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [error, setError] = useState<string | null>(null)

  const authFetch = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(path, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}`, 'content-type': 'application/json' } }),
    [token],
  )

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
      const name = (user.email ?? 'brand').split('@')[0]
      const { error: profileError } = await supabase
        .from('brands')
        .upsert({ id: user.id, name, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
      if (profileError) {
        setError('Could not set up your brand profile. Refresh and try again.')
      }
    })
  }, [router])

  async function postBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      title: String(form.get('title')),
      goal: String(form.get('goal')),
      budgetMin: Number(form.get('budgetMin')),
      budgetMax: Number(form.get('budgetMax')),
      currency: String(form.get('currency')),
      niche: String(form.get('niche')),
      region: String(form.get('region')),
      deliverables: String(form.get('deliverables')).split(',').map((d) => d.trim()).filter(Boolean),
    }
    const res = await authFetch('/api/briefs', { method: 'POST', body: JSON.stringify(payload) })
    if (!res.ok) {
      setError('Could not post the brief. Check your inputs.')
      return
    }
    const brief = await res.json()
    setBriefs((prev) => [brief, ...prev])
    event.currentTarget.reset()
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Post a brief</h1>
      <form onSubmit={postBrief} className="mt-6 space-y-3" data-testid="brief-form">
        <input name="title" required placeholder="campaign title" className="w-full rounded border p-2" />
        <textarea name="goal" required placeholder="goal" className="w-full rounded border p-2" />
        <div className="flex gap-3">
          <input name="budgetMin" type="number" min={1} required placeholder="budget min" className="w-full rounded border p-2" />
          <input name="budgetMax" type="number" min={1} required placeholder="budget max" className="w-full rounded border p-2" />
          <select name="currency" className="rounded border p-2"><option value="INR">INR</option><option value="AED">AED</option></select>
        </div>
        <div className="flex gap-3">
          <select name="niche" className="w-full rounded border p-2">
            {['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <select name="region" className="w-full rounded border p-2"><option value="IN">India</option><option value="AE">UAE</option></select>
        </div>
        <input name="deliverables" required placeholder="deliverables (comma separated)" className="w-full rounded border p-2" />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">Post brief</button>
      </form>

      <section className="mt-8">
        <h2 className="font-medium">Posted this session</h2>
        <ul className="mt-2 space-y-2" data-testid="brand-briefs">
          {briefs.map((b) => (
            <li key={b.id} className="rounded border p-3 text-sm">
              <span className="font-medium">{b.title}</span> · {b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()} · {b.niche}/{b.region}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
