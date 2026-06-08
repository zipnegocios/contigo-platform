'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { MediaLibraryProvider, useMediaLibrary, type EntityContext } from './MediaLibraryContext'
import { MediaSearchBar } from './MediaSearchBar'
import { MediaGrid } from './MediaGrid'
import { MediaBankSidebar } from './MediaBankSidebar'
import { MediaDetailDrawer } from './MediaDetailDrawer'
import { extractMediaMetadata } from '@/presentation/lib/extractMediaMetadata'

// ─── Tab configuration ────────────────────────────────────────────────────────

const TAB_LIST = [
  { key: 'all', label: 'All' },
  { key: 'projects', label: 'Projects' },
  { key: 'services', label: 'Services' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'bank', label: 'Bank' },
] as const

// ─── Inner orchestrator ───────────────────────────────────────────────────────

function MediaLibraryInner() {
  const { tab, setTab, detailItem, loading, refreshItems } = useMediaLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const meta = await extractMediaMetadata(file)
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: 'projects/gallery', filename: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) { alert('Error obtaining upload URL'); return }
      const { presignedUrl, key } = await presignRes.json()
      await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (Object.keys(meta).length > 0) {
        await fetch('/api/admin/media/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, ...meta }),
        })
      }
      await refreshItems()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <MediaSearchBar />

      {/* Tabs + Upload */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {TAB_LIST.map((t) => (
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
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            <Upload size={15} />
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-5 items-start">
        {tab === 'bank' && !loading && <MediaBankSidebar />}
        <MediaGrid />
        {detailItem && <MediaDetailDrawer />}
      </div>
    </div>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

interface MediaLibraryProps {
  entityContext?: EntityContext | null
}

export function MediaLibrary({ entityContext }: MediaLibraryProps = {}) {
  return (
    <MediaLibraryProvider entityContext={entityContext}>
      <MediaLibraryInner />
    </MediaLibraryProvider>
  )
}
