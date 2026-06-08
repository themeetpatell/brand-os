'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getBrowserClient } from '../lib/supabase/browser-client'

const LINKS = [
  { href: '/dashboard', label: 'Cockpit' },
  { href: '/briefs', label: 'Briefs' },
  { href: '/brand', label: 'For brands' },
]

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()

  async function signOut() {
    await getBrowserClient().auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-display text-xl font-semibold text-ink">Roster</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold" />
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 transition-colors ${
                  active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <button
            onClick={signOut}
            className="ml-2 rounded-full px-3.5 py-1.5 text-ink-faint transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
