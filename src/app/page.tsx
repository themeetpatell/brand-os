import Link from 'next/link'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'

const STEPS = [
  {
    n: '01',
    title: 'Enter your stats',
    body: 'Your handle, niche, and a few numbers. Sixty seconds — no login to start.',
  },
  {
    n: '02',
    title: 'Get a data-backed kit',
    body: 'A media kit that looks like a press spread, with a rate card grounded in real benchmarks.',
  },
  {
    n: '03',
    title: 'Hold your rate, get paid',
    body: 'Your agent screens brand offers against your floor and gets the money to you, on time.',
  },
]

const RATE_ROWS = [
  { label: 'Reel', value: '14,000 – 21,100' },
  { label: 'Story', value: '4,300 – 6,500' },
  { label: 'Carousel', value: '10,800 – 16,200' },
]

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-marigold/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-clay/10 blur-3xl" />

          <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
            <div>
              <p className="kicker reveal" style={{ animationDelay: '40ms' }}>
                AI manager · India-first
              </p>
              <h1
                className="font-display reveal mt-6 text-[clamp(2.9rem,6.5vw,5.2rem)] font-semibold leading-[0.96] text-ink"
                style={{ animationDelay: '110ms' }}
              >
                An{' '}
                <span className="italic text-marigold-deep">AI manager</span>
                <br />
                for every creator.
              </h1>
              <p
                className="reveal mt-7 max-w-md text-lg leading-relaxed text-ink-soft"
                style={{ animationDelay: '200ms' }}
              >
                Build a professional media kit and a data-backed rate card in sixty
                seconds. Then let your agent screen brand offers, hold your price, and
                get you paid.
              </p>

              <div
                className="reveal mt-9 flex flex-wrap items-center gap-5"
                style={{ animationDelay: '290ms' }}
              >
                <Link
                  href="/create"
                  data-testid="cta"
                  className="group rounded-full bg-marigold px-7 py-3.5 text-base font-medium text-ink shadow-soft transition-all duration-200 ease-[var(--ease-soft)] hover:-translate-y-0.5 hover:bg-marigold-deep hover:text-paper"
                >
                  Get your free media kit
                  <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link href="/#how" className="text-base text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink">
                  See how it works
                </Link>
              </div>

              <p className="reveal mt-8 text-sm text-ink-faint" style={{ animationDelay: '360ms' }}>
                Free to start · No credit card · Loved by nano &amp; micro creators
              </p>
            </div>

            {/* Hero visual — a media kit rendered like a press card */}
            <div className="reveal relative mx-auto w-full max-w-sm" style={{ animationDelay: '240ms' }}>
              <KitPreview />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-8">
          <div className="rule mb-12" />
          <div className="grid gap-10 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <div className="font-display text-4xl font-semibold text-marigold">{step.n}</div>
                <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rates / proof */}
        <section id="rates" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 rounded-[var(--radius-xl)] border border-line bg-card/70 p-10 shadow-soft lg:grid-cols-2 lg:p-14">
            <div>
              <p className="kicker">The end of guesswork</p>
              <h2 className="font-display mt-4 text-4xl font-semibold leading-tight text-ink">
                Rates grounded in real benchmarks — not vibes.
              </h2>
              <p className="mt-5 max-w-md text-ink-soft">
                Every kit comes with engagement-adjusted bands by niche, region, and tier.
                Walk into a brand conversation knowing exactly what your reel is worth.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-6">
              {[
                ['8–12:1', 'Micro-campaign ROI'],
                ['73%', 'Creators paid late, today'],
                ['60s', 'To your first kit'],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="font-display tnum text-4xl font-semibold text-ink">{stat}</dt>
                  <dd className="mt-2 text-xs leading-snug text-ink-soft">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function KitPreview() {
  return (
    <div className="relative">
      {/* floating accent chip */}
      <div className="absolute -left-6 top-10 z-20 rotate-[-6deg] rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-marigold-deep shadow-soft">
        ₹ data-backed
      </div>
      <div className="absolute -right-4 bottom-16 z-20 rotate-[5deg] rounded-full border border-line bg-ink px-3 py-1.5 text-xs font-medium text-paper shadow-soft">
        ✓ verified reach
      </div>

      <article
        className="float-card relative z-10 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-card shadow-lift"
        style={{ ['--rot' as string]: '2.5deg' }}
      >
        <div className="flex items-center justify-between bg-marigold px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Media Kit</span>
          <span className="text-xs text-ink/70">2026</span>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clay/15 font-display text-xl font-semibold text-clay">
              AS
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold leading-tight text-ink">Aanya Sharma</h3>
              <p className="text-sm text-ink-soft">@aanya.styles · Beauty · Mumbai</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Stat figure="50K" label="Followers" />
            <Stat figure="3.0%" label="Engagement" />
          </div>

          <div className="mt-6 rule" />

          <div className="mt-5">
            <p className="kicker mb-3">Rate card · INR</p>
            <table className="w-full text-sm">
              <tbody>
                {RATE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i < RATE_ROWS.length - 1 ? 'border-b border-line/60' : ''}>
                    <td className="py-2 font-medium text-ink">{row.label}</td>
                    <td className="tnum py-2 text-right text-ink-soft">₹ {row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  )
}

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/70 bg-paper/60 px-4 py-3">
      <div className="font-display tnum text-2xl font-semibold text-ink">{figure}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  )
}
