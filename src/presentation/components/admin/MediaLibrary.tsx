'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Upload, Film, Image, LayoutGrid } from 'lucide-react'

interface MediaObject {
  key: string
  size: number
  lastModified: string
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState<MediaObject[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [uploadingName, setUploadingName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    loadMedia()
  }, [loadMedia])

  async function handleDelete(key: string) {
    if (!confirm(`Delete "${key}"? This cannot be undone.`)) return
    setDeletingKey(key)
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setItems((prev) => prev.filter((i) => i.key !== key))
    } finally {
      setDeletingKey(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const prefix = TAB_PREFIXES[tab] ?? 'projects/gallery'
    const isVideo = file.type.startsWith('video/')

    setUploadingName(file.name)
    try {
      // Get presigned URL
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: isVideo ? 'projects/video' : prefix,
          filename: file.name,
          contentType: file.type,
        }),
      })
      if (!presignRes.ok) {
        alert('Failed to get upload URL')
        return
      }
      const { presignedUrl } = await presignRes.json()

      // Upload directly to R2
      await fetch(presignedUrl, { method: 'PUT', body: file })
      await loadMedia()
    } finally {
      setUploadingName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'cover', label: 'Cover Images' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'video', label: 'Videos' },
    { key: 'services', label: 'Services' },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs + Upload */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                tab === t.key
                  ? { backgroundColor: 'rgba(226,192,99,0.18)', color: '#E2C063' }
                  : { color: '#6B6560' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploadingName}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            <Upload size={15} />
            {uploadingName ? `Uploading ${uploadingName}…` : 'Upload New'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{ aspectRatio: '4/3', backgroundColor: 'rgba(226,192,99,0.08)' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl"
          style={{ border: '1px dashed rgba(226,192,99,0.2)', color: '#A89E8C' }}
        >
          <LayoutGrid size={32} className="mb-3 opacity-40" />
          <p className="text-sm">No media found in this section.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-sm underline"
            style={{ color: '#E2C063' }}
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))' }}>
          {items.map((item) => (
            <div
              key={item.key}
              className="group relative rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#1E1A16',
                border: '1px solid rgba(226,192,99,0.1)',
                aspectRatio: '4/3',
              }}
            >
              {item.mediaType === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={36} style={{ color: '#A89E8C' }} />
                </div>
              ) : item.mediaType === 'image' ? (
                <img
                  src={item.publicUrl}
                  alt={item.key}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={36} style={{ color: '#A89E8C' }} />
                </div>
              )}

              {/* Overlay on hover */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.92) 0%, transparent 60%)' }}
              >
                <p className="text-[10px] truncate mb-0.5" style={{ color: '#E8DCC4' }}>
                  {item.key.split('/').pop()}
                </p>
                <p className="text-[10px]" style={{ color: '#A89E8C' }}>
                  {formatBytes(item.size)}
                </p>
                <button
                  onClick={() => handleDelete(item.key)}
                  disabled={deletingKey === item.key}
                  className="absolute top-2 right-2 p-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
