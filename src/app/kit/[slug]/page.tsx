import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SupabaseKitRepository } from '../../../lib/repository/supabase-kit-repository'
import { createServerClient } from '../../../lib/supabase/server-client'
import { RateCardTable } from '../../../components/RateCardTable'

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const repo = new SupabaseKitRepository(createServerClient())
  const kit = await repo.getKitBySlug(slug)
  if (!kit) notFound()

  return (
    <div className="min-h-full">
      {/* Press-kit band */}
      <div className="border-b border-line/70 bg-paper-2/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-display text-xl font-semibold text-ink">Roster</span>
            <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-marigold" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-marigold-deep">
            Media Kit
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-10">
        {/* Masthead */}
        <header className="reveal pt-12" style={{ animationDelay: '40ms' }}>
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-clay/15 font-display text-3xl font-semibold text-clay">
              {initials(kit.stats.displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.02] text-ink">
                {kit.stats.displayName}
              </h1>
              <p className="mt-2 text-ink-soft">
                @{kit.stats.handle} ·{' '}
                <span className="capitalize">{kit.stats.niche}</span> ·{' '}
                <span className="capitalize">{kit.tier}</span>
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Figure value={kit.stats.followerCount.toLocaleString()} label="Followers" />
            <Figure value={`${kit.engagementRate}%`} label="Engagement" />
            <Figure value={kit.rateCard.currency} label="Rates in" />
          </div>
        </header>

        {/* Statement */}
        <section className="reveal mt-14" style={{ animationDelay: '120ms' }}>
          <div className="rule mb-8" />
          <h2 className="font-display text-3xl font-semibold leading-snug text-ink">
            {kit.copy.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink">{kit.copy.bio}</p>
          <p className="mt-4 leading-relaxed text-ink-soft">{kit.copy.audienceSummary}</p>
        </section>

        {/* Brand fit */}
        <section className="reveal mt-12" style={{ animationDelay: '200ms' }}>
          <p className="kicker">Good fit for</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {kit.copy.brandFitCategories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-marigold/40 bg-marigold/10 px-4 py-1.5 text-sm font-medium capitalize text-marigold-deep"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Highlights */}
        {kit.copy.highlights.length > 0 && (
          <section className="reveal mt-12" style={{ animationDelay: '260ms' }}>
            <p className="kicker">Highlights</p>
            <ul className="mt-4 space-y-2.5">
              {kit.copy.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Rate card */}
        <section className="reveal mt-14" style={{ animationDelay: '320ms' }}>
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-line/70 px-7 py-4">
              <p className="kicker">Rate card · {kit.rateCard.currency}</p>
              <span className="text-xs text-ink-faint">Engagement-adjusted</span>
            </div>
            <div className="px-7 py-2">
              <RateCardTable rateCard={kit.rateCard} />
            </div>
          </div>
          <p className="mt-3 px-1 text-xs text-ink-faint">
            Bands reflect niche, region, and engagement benchmarks. Final rates set by the creator.
          </p>
        </section>

        {/* Footer CTA */}
        <div className="reveal mt-16 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-xl)] bg-ink px-8 py-7 text-paper sm:flex-row sm:items-center" style={{ animationDelay: '380ms' }}>
          <div>
            <p className="font-display text-xl font-semibold">Built with Roster</p>
            <p className="mt-1 text-sm text-paper/70">An AI manager for every creator.</p>
          </div>
          <Link
            href="/create"
            className="shrink-0 rounded-full bg-marigold px-5 py-2.5 text-sm font-medium text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Get your own kit →
          </Link>
        </div>
      </main>
    </div>
  )
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/70 bg-card/60 px-4 py-3">
      <div className="font-display tnum text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  )
}
