'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ComparisonCardsBlockData } from '@/types/pageBlocks'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'

interface ComparisonCardsEditorProps { data: ComparisonCardsBlockData; onChange: (data: ComparisonCardsBlockData) => void }

export function ComparisonCardsEditor({ data, onChange }: ComparisonCardsEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }

  const updateCard = (idx: number, key: keyof ComparisonCardsBlockData['cards'][0], value: unknown) => {
    onChange({ cards: data.cards.map((c, i) => i === idx ? { ...c, [key]: value } : c) })
  }
  const addCard = () => onChange({ cards: [...data.cards, { title: '', points: [''] }] })
  const removeCard = (idx: number) => onChange({ cards: data.cards.filter((_, i) => i !== idx) })
  const updatePoint = (cardIdx: number, ptIdx: number, value: string) => {
    const points = data.cards[cardIdx].points.map((p, i) => i === ptIdx ? value : p)
    updateCard(cardIdx, 'points', points)
  }
  const addPoint = (cardIdx: number) => updateCard(cardIdx, 'points', [...data.cards[cardIdx].points, ''])
  const removePoint = (cardIdx: number, ptIdx: number) =>
    updateCard(cardIdx, 'points', data.cards[cardIdx].points.filter((_, i) => i !== ptIdx))

  return (
    <div className="space-y-4">
      {data.cards.map((card, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-semibold" style={{ color: '#A07B2A' }}>Card {idx + 1}</span>
            {data.cards.length > 1 && (
              <button onClick={() => removeCard(idx)} style={{ color: '#9C8F83' }}><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <input type="text" value={card.title} onChange={(e) => updateCard(idx, 'title', e.target.value)}
            placeholder="Card title" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <CoverMediaSelector
            coverUrl={card.imageUrl ?? null}
            posterUrl={null}
            onChange={(cover, _poster) => updateCard(idx, 'imageUrl', cover || undefined)}
            folder="services/blocks"
          />
          <div className="space-y-1">
            <p className="text-fluid-xs" style={{ color: '#6B6560' }}>Bullet points:</p>
            {card.points.map((pt, ptIdx) => (
              <div key={ptIdx} className="flex gap-1">
                <input type="text" value={pt} onChange={(e) => updatePoint(idx, ptIdx, e.target.value)}
                  placeholder={`Point ${ptIdx + 1}`} className="flex-1 px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
                {card.points.length > 1 && (
                  <button onClick={() => removePoint(idx, ptIdx)} style={{ color: '#9C8F83' }}><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addPoint(idx)} className="text-fluid-xs" style={{ color: '#A07B2A' }}>
              + Add point
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addCard} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add card
      </button>
    </div>
  )
}
