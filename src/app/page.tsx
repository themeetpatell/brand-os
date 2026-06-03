import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 p-10">
      <h1 className="text-4xl font-semibold">An AI manager for every creator.</h1>
      <p className="text-lg text-gray-600">
        Build a professional media kit and a data-backed rate card in 60 seconds. Free.
      </p>
      <Link href="/create" className="rounded bg-black px-5 py-3 text-white" data-testid="cta">
        Get your free media kit
      </Link>
    </main>
  )
}
