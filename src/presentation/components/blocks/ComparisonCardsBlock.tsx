import type { ComparisonCardsBlockData } from '@/types/pageBlocks'
import { Check } from 'lucide-react'

interface ComparisonCardsBlockProps { data: ComparisonCardsBlockData }

export function ComparisonCardsBlock({ data }: ComparisonCardsBlockProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.cards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #E5DDD0', backgroundColor: '#FAFAF8' }}
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.title} className="w-full h-44 object-cover" />
            )}
            <div className="p-5">
              <h3 className="text-fluid-base font-semibold mb-3" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {card.title}
              </h3>
              <ul className="space-y-2">
                {card.points.filter(Boolean).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-fluid-sm" style={{ color: '#6B6560' }}>
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E2C063' }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
