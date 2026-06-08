'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech']
const REGIONS = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
]

const inputClass =
  'w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-marigold focus:bg-card'

export default function CreatePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      handle: String(form.get('handle')),
      displayName: String(form.get('displayName')),
      email: String(form.get('email')),
      niche: String(form.get('niche')),
      region: String(form.get('region')),
      followerCount: Number(form.get('followerCount')),
      avgLikes: Number(form.get('avgLikes')),
      avgComments: Number(form.get('avgComments')),
    }
    const res = await fetch('/api/media-kit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      setSubmitting(false)
      setError('Could not generate your kit. Check your inputs and try again.')
      return
    }
    const { slug } = await res.json()
    router.push(`/kit/${slug}`)
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link href="/" className="flex w-fit items-baseline gap-1">
          <span className="font-display text-xl font-semibold text-ink">Roster</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold" />
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-14 px-6 pb-24 lg:grid-cols-[1fr_0.8fr]">
        {/* Form */}
        <div className="reveal" style={{ animationDelay: '60ms' }}>
          <p className="kicker">Sixty seconds · no login</p>
          <h1 className="font-display mt-4 text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-tight text-ink">
            Get your free AI media kit
          </h1>
          <p className="mt-3 max-w-md text-ink-soft">
            Enter your stats. We build a press-grade media kit and a data-backed rate
            card you can share with any brand.
          </p>

          <form onSubmit={onSubmit} className="mt-9 space-y-6" data-testid="create-form">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Instagram handle">
                <input name="handle" required placeholder="aanya.styles" className={inputClass} />
              </Field>
              <Field label="Your name">
                <input name="displayName" required placeholder="Aanya Sharma" className={inputClass} />
              </Field>
            </div>

            <Field label="Email">
              <input name="email" type="email" required placeholder="you@email.com" className={inputClass} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Niche">
                <select name="niche" required className={inputClass}>
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n.charAt(0).toUpperCase() + n.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Region">
                <select name="region" required className={inputClass}>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rule" />

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Followers">
                <input name="followerCount" type="number" min={1} required placeholder="50000" className={inputClass} />
              </Field>
              <Field label="Avg likes / post">
                <input name="avgLikes" type="number" min={0} required placeholder="1400" className={inputClass} />
              </Field>
              <Field label="Avg comments / post">
                <input name="avgComments" type="number" min={0} required placeholder="100" className={inputClass} />
              </Field>
            </div>

            {error && (
              <p className="rounded-[12px] border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group w-full rounded-full bg-marigold px-6 py-3.5 text-base font-medium text-ink shadow-soft transition-all duration-200 ease-[var(--ease-soft)] hover:-translate-y-0.5 hover:bg-marigold-deep hover:text-paper disabled:translate-y-0 disabled:opacity-60"
            >
              {submitting ? 'Building your kit…' : 'Build my media kit'}
              {!submitting && (
                <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              )}
            </button>
          </form>
        </div>

        {/* Reassurance aside */}
        <aside className="reveal lg:sticky lg:top-24" style={{ animationDelay: '160ms' }}>
          <div className="rounded-[var(--radius-xl)] border border-line bg-card/70 p-7 shadow-soft">
            <p className="kicker">What you get</p>
            <ul className="mt-5 space-y-5">
              {[
                ['A shareable media kit', 'Reads like a press spread — your bio, audience, and brand fit, written by your agent.'],
                ['A data-backed rate card', 'Engagement-adjusted bands by niche, region, and tier. No more underpricing.'],
                ['Your link, instantly', 'Send it to brands in a DM. It works with zero brands on the platform.'],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marigold" />
                  <div>
                    <p className="font-medium text-ink">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 px-2 text-sm text-ink-faint">
            We never post on your behalf or sell your data. Your kit, your rules.
          </p>
        </aside>
      </div>
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
