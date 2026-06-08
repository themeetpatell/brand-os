'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(mode: 'signin' | 'signup') {
    setBusy(true)
    setError(null)
    const supabase = getBrowserClient()
    const fn =
      mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password })
    const { error: authError } = await fn
    setBusy(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/dashboard')
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">Sign in to Roster</h1>
      <p className="mt-2 text-sm text-gray-500">Your media kit, deals, and payments in one place.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          run('signin')
        }}
      >
        <input
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />
        <input
          type="password"
          required
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-black p-3 text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Sign in'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run('signup')}
          className="w-full rounded border p-3 disabled:opacity-50"
        >
          Create account
        </button>
      </form>
    </main>
  )
}
