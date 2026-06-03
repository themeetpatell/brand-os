'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NICHES = ['fashion', 'beauty', 'fitness', 'food', 'lifestyle', 'tech']
const REGIONS = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
]

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
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Get your free AI media kit</h1>
      <p className="mt-2 text-sm text-gray-500">
        Enter your Instagram stats. We build your media kit and a data-backed rate card.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" data-testid="create-form">
        <input name="handle" required placeholder="instagram handle" className="w-full rounded border p-2" />
        <input name="displayName" required placeholder="your name" className="w-full rounded border p-2" />
        <input name="email" type="email" required placeholder="email" className="w-full rounded border p-2" />
        <select name="niche" required className="w-full rounded border p-2">
          {NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select name="region" required className="w-full rounded border p-2">
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <input name="followerCount" type="number" min={1} required placeholder="followers" className="w-full rounded border p-2" />
        <input name="avgLikes" type="number" min={0} required placeholder="avg likes per post" className="w-full rounded border p-2" />
        <input name="avgComments" type="number" min={0} required placeholder="avg comments per post" className="w-full rounded border p-2" />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded bg-black p-3 text-white disabled:opacity-50">
          {submitting ? 'Building…' : 'Build my media kit'}
        </button>
      </form>
    </main>
  )
}
