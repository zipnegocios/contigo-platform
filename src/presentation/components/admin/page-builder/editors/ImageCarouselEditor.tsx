'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ImageCarouselBlockData } from '@/types/pageBlocks'
import { CoverMediaSelector } from '@/presentation/components/admin/CoverMediaSelector'

interface ImageCarouselEditorProps { data: ImageCarouselBlockData; onChange: (data: ImageCarouselBlockData) => void }

export function ImageCarouselEditor({ data, onChange }: ImageCarouselEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }

  const update = (idx: number, key: 'url' | 'caption', value: string) => {
    onChange({ images: data.images.map((img, i) => i === idx ? { ...img, [key]: value } : img) })
  }
  const add = () => onChange({ images: [...data.images, { url: '', caption: '' }] })
  const remove = (idx: number) => onChange({ images: data.images.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {data.images.map((img, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Image {idx + 1}</span>
            <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" style={{ color: '#9C8F83' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <CoverMediaSelector
            coverUrl={img.url || null}
            posterUrl={null}
            onChange={(cover, _poster) => update(idx, 'url', cover || '')}
            folder="services/blocks"
          />
          <input type="text" value={img.caption ?? ''} onChange={(e) => update(idx, 'caption', e.target.value)}
            placeholder="Caption (optional)" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add image
      </button>
    </div>
  )
}
