'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '../../lib/supabase/browser-client'

const inputClass =
  'w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-marigold'

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
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Editorial panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-marigold/25 blur-3xl" />
        <Link href="/" className="relative flex items-baseline gap-1">
          <span className="font-display text-2xl font-semibold text-paper">Roster</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold" />
        </Link>
        <blockquote className="relative max-w-sm">
          <p className="font-display text-3xl font-medium leading-snug">
            “Instagram is the stage. Roster is the{' '}
            <span className="italic text-marigold">business</span>.”
          </p>
          <p className="mt-5 text-sm text-paper/60">
            Your media kit, your rates, your money — managed in one place.
          </p>
        </blockquote>
        <p className="relative text-xs text-paper/40">India-first · Built for the creator long tail</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="reveal w-full max-w-sm" style={{ animationDelay: '60ms' }}>
          <Link href="/" className="mb-8 flex w-fit items-baseline gap-1 lg:hidden">
            <span className="font-display text-2xl font-semibold text-ink">Roster</span>
            <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold" />
          </Link>

          <p className="kicker">Welcome back</p>
          <h1 className="font-display mt-3 text-3xl font-semibold text-ink">Sign in to Roster</h1>
          <p className="mt-2 text-sm text-ink-soft">Your cockpit, deals, and payments in one place.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              run('signin')
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">Email</span>
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">Password</span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p className="rounded-[12px] border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-marigold px-6 py-3 font-medium text-ink shadow-soft transition-all duration-200 ease-[var(--ease-soft)] hover:-translate-y-0.5 hover:bg-marigold-deep hover:text-paper disabled:translate-y-0 disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Sign in'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run('signup')}
              className="w-full rounded-full border border-line bg-card px-6 py-3 font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-60"
            >
              Create account
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
