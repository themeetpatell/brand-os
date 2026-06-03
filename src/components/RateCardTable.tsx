import type { RateCard } from '../lib/domain/types'

const ROWS: { key: 'reel' | 'story' | 'carousel' | 'bundle'; label: string }[] = [
  { key: 'reel', label: 'Reel' },
  { key: 'story', label: 'Story' },
  { key: 'carousel', label: 'Carousel / Post' },
  { key: 'bundle', label: 'Bundle (1 reel + 3 stories)' },
]

export function RateCardTable({ rateCard }: { rateCard: RateCard }) {
  const fmt = (n: number) => `${rateCard.currency} ${n.toLocaleString()}`
  return (
    <table className="w-full text-left text-sm" data-testid="rate-card">
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key} className="border-b">
            <td className="py-2 font-medium">{row.label}</td>
            <td className="py-2 text-right">
              {fmt(rateCard[row.key].min)} – {fmt(rateCard[row.key].max)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
