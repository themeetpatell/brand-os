'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBrowserClient } from '../../lib/supabase/browser-client'
import { AppHeader } from '../../components/AppHeader'

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

const inputClass =
  'w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-marigold'

export default function BrandPage() {
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
        window.location.href = '/login'
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
  }, [])

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
    <div className="min-h-full">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="kicker">Find creators who fit</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-ink">Post a brief</h1>
        <p className="mt-2 max-w-md text-ink-soft">
          Describe the campaign. Matched creators see it and apply at — or above — their floor.
        </p>

        <form onSubmit={postBrief} className="mt-8 space-y-5" data-testid="brief-form">
          <Field label="Campaign title">
            <input name="title" required placeholder="Summer skincare launch" className={inputClass} />
          </Field>
          <Field label="Goal">
            <textarea name="goal" required placeholder="What should this campaign achieve?" rows={3} className={inputClass} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Budget min">
              <input name="budgetMin" type="number" min={1} required placeholder="8000" className={inputClass} />
            </Field>
            <Field label="Budget max">
              <input name="budgetMax" type="number" min={1} required placeholder="25000" className={inputClass} />
            </Field>
            <Field label="Currency">
              <select name="currency" className={inputClass}>
                <option value="INR">INR</option>
                <option value="AED">AED</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Niche">
              <select name="niche" className={inputClass}>
                {['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech'].map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <select name="region" className={inputClass}>
                <option value="IN">India</option>
                <option value="AE">UAE</option>
              </select>
            </Field>
          </div>

          <Field label="Deliverables">
            <input name="deliverables" required placeholder="1 reel, 2 stories" className={inputClass} />
          </Field>

          {error && (
            <p className="rounded-[12px] border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="rounded-full bg-marigold px-6 py-3 font-medium text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigold-deep hover:text-paper"
          >
            Post brief
          </button>
        </form>

        <section className="mt-14">
          <div className="rule mb-6" />
          <h2 className="font-display text-xl font-semibold text-ink">Posted this session</h2>
          <ul className="mt-4 space-y-3" data-testid="brand-briefs">
            {briefs.length === 0 && (
              <li className="text-sm text-ink-faint">Your posted briefs will appear here.</li>
            )}
            {briefs.map((b) => (
              <li key={b.id} className="rounded-[var(--radius-lg)] border border-line bg-card px-5 py-4 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-ink">{b.title}</span>
                  <span className="tnum whitespace-nowrap text-sm text-ink-soft">
                    {b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-xs capitalize text-ink-faint">
                  {b.niche} · {b.region}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
