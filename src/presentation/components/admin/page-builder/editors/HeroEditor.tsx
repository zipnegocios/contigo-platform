'use client'

import type { HeroBlockData } from '@/types/pageBlocks'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'

interface HeroEditorProps {
  data: HeroBlockData
  onChange: (data: HeroBlockData) => void
}

const labelStyle = { color: '#6B6560' } as const
const inputStyle = {
  backgroundColor: '#F0EBE3',
  color: '#2D2924',
  border: '1px solid #E5DDD0',
} as const

export function HeroEditor({ data, onChange }: HeroEditorProps) {
  const set = <K extends keyof HeroBlockData>(key: K, value: HeroBlockData[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>
          Background Image / Video
        </label>
        <CoverMediaSelector
          coverUrl={data.imageUrl || null}
          posterUrl={data.videoUrl || null}
          onChange={(cover, poster) =>
            onChange({
              ...data,
              imageUrl: cover || '',
              videoUrl: poster || undefined,
            })
          }
          folder="services/blocks"
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Hero title"
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Subtitle (optional)</label>
        <input
          type="text"
          value={data.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value || undefined)}
          placeholder="Subtitle text"
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-2" style={labelStyle}>
          Overlay Opacity: {data.overlayOpacity}%
        </label>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={data.overlayOpacity}
          onChange={(e) => set('overlayOpacity', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  )
}
