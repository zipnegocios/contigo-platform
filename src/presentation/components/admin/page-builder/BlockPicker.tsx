'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'

const BLOCK_ICONS: Record<PageBlock['type'], string> = {
  'hero':             '🖼',
  'rich-text':        '📝',
  'gallery':          '🗃',
  'process':          '📋',
  'two-column':       '⬛⬜',
  'features-grid':    '⊞',
  'cta':             '🔲',
  'image-carousel':  '🎠',
  'comparison-cards': '⚖',
  'whatsapp-cta':    '💬',
  'custom':          '</>',
}

const BLOCK_TYPES: PageBlock['type'][] = [
  'hero', 'rich-text', 'gallery', 'process',
  'two-column', 'features-grid', 'cta',
  'image-carousel', 'comparison-cards', 'whatsapp-cta', 'custom',
]

interface BlockPickerProps {
  onSelect: (type: PageBlock['type']) => void
  onClose: () => void
}

export function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-2xl overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid #E5DDD0' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F5EFE8' }}>
        <span className="text-fluid-xs font-semibold" style={{ color: '#2D2924' }}>Choose a block</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5" style={{ color: '#6B6560' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
            style={{ color: '#2D2924' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span className="text-base flex-shrink-0">{BLOCK_ICONS[type]}</span>
            <span className="text-fluid-xs font-medium truncate">{BLOCK_LABELS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
