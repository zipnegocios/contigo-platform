'use client'

import { useState } from 'react'
import type { GalleryBlockData } from '@/types/pageBlocks'
import { GalleryManagerModal } from '@/presentation/components/admin/GalleryManagerModal'
import type { GalleryItem } from '@/types/media'

interface GalleryEditorProps {
  data: GalleryBlockData
  onChange: (data: GalleryBlockData) => void
}

export function GalleryEditor({ data, onChange }: GalleryEditorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <p className="text-fluid-xs mb-3" style={{ color: '#6B6560' }}>
        {data.items.length} image{data.items.length !== 1 ? 's' : ''} in gallery
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-fluid-xs font-semibold transition-all"
        style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
      >
        Manage Gallery
      </button>
      {open && (
        <GalleryManagerModal
          items={data.items as GalleryItem[]}
          onSave={(items) => { onChange({ items }); setOpen(false) }}
          onClose={() => setOpen(false)}
          folder="services/blocks"
        />
      )}
    </div>
  )
}
