import type { RateCard } from '../lib/domain/types'

const ROWS: { key: 'reel' | 'story' | 'carousel' | 'bundle'; label: string }[] = [
  { key: 'reel', label: 'Reel' },
  { key: 'story', label: 'Story' },
  { key: 'carousel', label: 'Carousel / Post' },
  { key: 'bundle', label: 'Bundle · 1 reel + 3 stories' },
]

export function RateCardTable({ rateCard }: { rateCard: RateCard }) {
  const fmt = (n: number) => `${rateCard.currency} ${n.toLocaleString()}`
  return (
    <table className="w-full text-left" data-testid="rate-card">
      <tbody>
        {ROWS.map((row, i) => (
          <tr key={row.key} className={i < ROWS.length - 1 ? 'border-b border-line/70' : ''}>
            <td className="py-3.5 pr-4 align-top">
              <span className="font-medium text-ink">{row.label}</span>
            </td>
            <td className="tnum whitespace-nowrap py-3.5 text-right text-ink-soft">
              {fmt(rateCard[row.key].min)} <span className="text-ink-faint">–</span>{' '}
              {fmt(rateCard[row.key].max)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
