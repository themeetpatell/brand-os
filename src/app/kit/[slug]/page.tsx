import { notFound } from 'next/navigation'
import { SupabaseKitRepository } from '../../../lib/repository/supabase-kit-repository'
import { createServerClient } from '../../../lib/supabase/server-client'
import { RateCardTable } from '../../../components/RateCardTable'

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const repo = new SupabaseKitRepository(createServerClient())
  const kit = await repo.getKitBySlug(slug)
  if (!kit) notFound()

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header>
        <h1 className="text-3xl font-semibold">{kit.stats.displayName}</h1>
        <p className="text-gray-500">@{kit.stats.handle} · {kit.stats.niche} · {kit.tier}</p>
        <p className="mt-1 text-sm text-gray-500">
          {kit.stats.followerCount.toLocaleString()} followers · {kit.engagementRate}% engagement
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-medium">{kit.copy.headline}</h2>
        <p className="mt-2 text-gray-700">{kit.copy.bio}</p>
        <p className="mt-2 text-sm text-gray-600">{kit.copy.audienceSummary}</p>
      </section>

      <section className="mt-6">
        <h3 className="font-medium">Good fit for</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {kit.copy.brandFitCategories.map((c) => (
            <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-sm">{c}</span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="font-medium">Rate card</h3>
        <div className="mt-2">
          <RateCardTable rateCard={kit.rateCard} />
        </div>
      </section>
    </main>
  )
}
