import Link from 'next/link'

interface SiteHeaderProps {
  cta?: { href: string; label: string }
}

export function SiteHeader({ cta = { href: '/create', label: 'Get your kit' } }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-baseline gap-1">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            Roster
          </span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold transition-transform group-hover:scale-150" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
          <Link href="/#how" className="transition-colors hover:text-ink">
            How it works
          </Link>
          <Link href="/#rates" className="transition-colors hover:text-ink">
            Rates
          </Link>
          <Link href="/brand" className="transition-colors hover:text-ink">
            For brands
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden text-sm text-ink-soft transition-colors hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            href={cta.href}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform duration-200 ease-[var(--ease-soft)] hover:-translate-y-0.5"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  )
}
