'use client'

import type { TwoColumnBlockData } from '@/types/pageBlocks'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'

interface TwoColumnEditorProps { data: TwoColumnBlockData; onChange: (data: TwoColumnBlockData) => void }

export function TwoColumnEditor({ data, onChange }: TwoColumnEditorProps) {
  const set = <K extends keyof TwoColumnBlockData>(k: K, v: TwoColumnBlockData[K]) => onChange({ ...data, [k]: v })
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Image</label>
        <CoverMediaSelector
          coverUrl={data.imageUrl || null}
          posterUrl={null}
          onChange={(cover, _poster) => set('imageUrl', cover || '')}
          folder="services/blocks"
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Image Side</label>
        <div className="flex gap-2">
          {(['left', 'right'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => set('imageSide', side)}
              className="flex-1 py-2 rounded-lg text-fluid-xs font-medium capitalize"
              style={data.imageSide === side
                ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px solid #E2C063' }
                : { ...s }}
            >
              {side}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Title (optional)</label>
        <input type="text" value={data.title ?? ''} onChange={(e) => set('title', e.target.value || undefined)}
          placeholder="Section title" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Text</label>
        <textarea value={data.text} onChange={(e) => set('text', e.target.value)}
          rows={4} placeholder="Description text" className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
      </div>
    </div>
  )
}
