'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Film, Loader2 } from 'lucide-react'

interface MediaObject {
  key: string
  size: number
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
}

type Tab = 'all' | 'cover' | 'gallery' | 'video' | 'services'

const TAB_PREFIXES: Record<Tab, string | undefined> = {
  all: undefined,
  cover: 'projects/cover',
  gallery: 'projects/gallery',
  video: 'projects/video',
  services: 'services',
}

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string) => void
  defaultTab?: Tab
  allowVideo?: boolean
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  defaultTab = 'all',
  allowVideo = false,
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [items, setItems] = useState<MediaObject[]>([])
  const [loading, setLoading] = useState(false)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    try {
      const prefix = TAB_PREFIXES[tab]
      const url = prefix ? `/api/admin/media?prefix=${encodeURIComponent(prefix)}` : '/api/admin/media'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    if (open) loadMedia()
  }, [open, loadMedia])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const visibleItems = allowVideo ? items : items.filter((i) => i.mediaType !== 'video')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'cover', label: 'Cover' },
    { key: 'gallery', label: 'Gallery' },
    ...(allowVideo ? [{ key: 'video' as Tab, label: 'Videos' }] : []),
    { key: 'services', label: 'Services' },
  ]

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <div
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 860,
          maxHeight: '85vh',
          backgroundColor: '#FAF6F0',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5DDD0' }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
          >
            Media Library
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: '#A89E8C' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={
                tab === t.key
                  ? { backgroundColor: '#E2C063', color: '#1E1A16' }
                  : { color: '#6B6560' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: '#E2C063' }} />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm" style={{ color: '#A89E8C' }}>
                No media found in this section.
              </p>
              <p className="text-xs mt-1" style={{ color: '#C5BDB5' }}>
                Upload files from the Media Library page first.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
            >
              {visibleItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { onSelect(item.publicUrl); onClose() }}
                  className="group relative rounded-xl overflow-hidden text-left transition-all duration-150 hover:ring-2"
                  style={{
                    aspectRatio: '4/3',
                    backgroundColor: '#1E1A16',
                    border: '1px solid rgba(226,192,99,0.12)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.outline = '2px solid #E2C063' }}
                  onMouseLeave={(e) => { e.currentTarget.style.outline = 'none' }}
                >
                  {item.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={28} style={{ color: '#A89E8C' }} />
                    </div>
                  ) : (
                    <img
                      src={item.publicUrl}
                      alt={item.key}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {/* filename tooltip on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200"
                    style={{ backgroundColor: 'rgba(30,26,22,0.88)' }}
                  >
                    <p className="text-[10px] truncate" style={{ color: '#E8DCC4' }}>
                      {item.key.split('/').pop()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-xs flex-shrink-0"
          style={{ borderTop: '1px solid #E5DDD0', color: '#A89E8C' }}
        >
          {visibleItems.length} file{visibleItems.length !== 1 ? 's' : ''} — click any to select
        </div>
      </div>
    </div>
  )
}
