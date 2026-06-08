'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

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
  const router = useRouter()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async (token: string) => {
    const res = await fetch('/api/briefs', { headers: { authorization: `Bearer ${token}` } })
    if (res.ok) {
      setBriefs((await res.json()).briefs)
    } else {
      setMessage('Complete your creator profile (niche + region) to see matched briefs.')
    }
  }, [])

  useEffect(() => {
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.push('/login')
          return
        }
        load(data.session.access_token)
      })
  }, [router, load])

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Briefs for you</h1>
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
      <ul className="mt-6 space-y-3" data-testid="briefs-feed">
        {briefs.map((b) => (
          <li key={b.id} className="rounded border p-4">
            <div className="font-medium">{b.title}</div>
            <p className="mt-1 text-sm text-gray-600">{b.goal}</p>
            <p className="mt-2 text-sm">{b.currency} {b.budgetMin.toLocaleString()}–{b.budgetMax.toLocaleString()} · {b.deliverables.join(', ')}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
