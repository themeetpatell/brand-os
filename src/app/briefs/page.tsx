'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBrowserClient } from '../../lib/supabase/browser-client'
import { AppHeader } from '../../components/AppHeader'

interface Brief {
  id: string
  title: string
  goal: string
  budgetMin: number
  budgetMax: number
  currency: string
  niche: string
  region: string
  deliverables: string[]
}

export default function BriefsFeedPage() {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const load = useCallback(async (token: string) => {
    const res = await fetch('/api/briefs', { headers: { authorization: `Bearer ${token}` } })
    if (res.ok) {
      setBriefs((await res.json()).briefs)
    } else {
      setMessage('Complete your creator profile (niche + region) to see matched briefs.')
    }
    setReady(true)
  }, [])

  useEffect(() => {
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          window.location.href = '/login'
          return
        }
        load(data.session.access_token)
      })
  }, [load])

  return (
    <div className="min-h-full">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="kicker">Matched to your kit</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-ink">Briefs for you</h1>
        <p className="mt-2 text-ink-soft">Open campaigns in your niche and region, within budget for your rate.</p>

        {message && (
          <p className="mt-8 rounded-[var(--radius-lg)] border border-line bg-card px-5 py-4 text-sm text-ink-soft">
            {message}
          </p>
        )}

        {ready && !message && briefs.length === 0 && (
          <p className="mt-8 rounded-[var(--radius-lg)] border border-line bg-card px-5 py-10 text-center text-sm text-ink-faint">
            No matched briefs right now — check back soon.
          </p>
        )}

        <ul className="mt-8 space-y-4" data-testid="briefs-feed">
          {briefs.map((b) => (
            <li
              key={b.id}
              className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft transition-transform duration-200 ease-[var(--ease-soft)] hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-xl font-semibold leading-snug text-ink">{b.title}</h2>
                <span className="tnum shrink-0 rounded-full bg-marigold/12 px-3 py-1 text-sm font-medium text-marigold-deep">
                  {b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.goal}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {b.deliverables.map((d) => (
                  <span key={d} className="rounded-full border border-line bg-paper/60 px-3 py-1 text-xs text-ink-soft">
                    {d}
                  </span>
                ))}
                <span className="rounded-full border border-line bg-paper/60 px-3 py-1 text-xs capitalize text-ink-faint">
                  {b.niche} · {b.region}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
