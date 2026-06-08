import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold text-ink">Roster</span>
            <span className="h-1.5 w-1.5 translate-y-[-3px] rounded-full bg-marigold" />
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            An AI manager for every creator. Your media kit, your rates, your money —
            in one place.
          </p>
        </div>
        <div className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2 text-ink-soft">
            <span className="kicker mb-1">Product</span>
            <Link href="/create" className="hover:text-ink">Media kit</Link>
            <Link href="/briefs" className="hover:text-ink">Briefs</Link>
            <Link href="/dashboard" className="hover:text-ink">Cockpit</Link>
          </div>
          <div className="flex flex-col gap-2 text-ink-soft">
            <span className="kicker mb-1">Company</span>
            <Link href="/brand" className="hover:text-ink">For brands</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-10 text-xs text-ink-faint">
        © {2026} Roster · India-first · Built for the creator long tail.
      </div>
    </footer>
  )
}
