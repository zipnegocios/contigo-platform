'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Film, Image as ImageIcon, ExternalLink, ImagePlus, Trash2 } from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'
import { AssignToEntityModal } from './AssignToEntityModal'
import { aspectRatio, formatDuration } from '@/presentation/lib/extractMediaMetadata'
import type { GalleryItem } from '@/types/media'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatMime(fmt: string | null | undefined): string {
  if (!fmt) return '—'
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/png': 'PNG',
    'image/webp': 'WebP', 'image/gif': 'GIF', 'image/avif': 'AVIF',
    'image/svg+xml': 'SVG', 'video/mp4': 'MP4', 'video/webm': 'WebM',
    'video/ogg': 'OGG', 'video/quicktime': 'MOV',
  }
  return map[fmt] ?? fmt.split('/')[1]?.toUpperCase() ?? fmt
}

const FIELD_LABELS: Record<string, string> = {
  cover: 'Cover', gallery: 'Gallery', poster: 'Poster', image: 'Image',
}

function MetaField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#6B6560' }}>{label}</p>
      <p className="text-xs font-medium" style={{ color: gold ? 'var(--contigo-primary)' : 'var(--neutral-50)' }}>{value}</p>
    </div>
  )
}

export function MediaDetailDrawer() {
  const { detailItem, closeDetail, folders, tags, updateMetadata, deleteItem, entityContext } = useMediaLibrary()

  const [copied, setCopied] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignConfirm, setAssignConfirm] = useState<string | null>(null)
  const [measuredDims, setMeasuredDims] = useState<{ width: number; height: number } | null>(null)
  const [measuredDuration, setMeasuredDuration] = useState<number | null>(null)
  const [localFolderId, setLocalFolderId] = useState<string>('')
  const [localNotes, setLocalNotes] = useState<string>('')
  const [localTags, setLocalTags] = useState<string[]>([])

  const item = detailItem

  useEffect(() => {
    if (!item) {
      setMeasuredDims(null)
      setMeasuredDuration(null)
      return
    }
    setLocalFolderId(item.metadata?.folderId ?? '')
    setLocalNotes(item.metadata?.notes ?? '')
    setLocalTags(item.metadata?.tags ?? [])

    if (!item.metadata?.width && item.mediaType === 'image') {
      const img = document.createElement('img')
      img.onload = () => setMeasuredDims({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = item.publicUrl
    }
    if (!item.metadata?.duration && item.mediaType === 'video') {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        if (isFinite(video.duration)) setMeasuredDuration(Math.round(video.duration))
        if (!item.metadata?.width && video.videoWidth)
          setMeasuredDims({ width: video.videoWidth, height: video.videoHeight })
      }
      video.src = item.publicUrl
    }
  }, [item])

  if (!item) return null

  const width = item.metadata?.width ?? measuredDims?.width ?? null
  const height = item.metadata?.height ?? measuredDims?.height ?? null
  const duration = item.metadata?.duration ?? measuredDuration ?? null
  const filename = item.key.split('/').pop() ?? item.key

  const handleCopy = () => {
    navigator.clipboard.writeText(item.publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFolderChange = async (folderId: string) => {
    setLocalFolderId(folderId)
    await updateMetadata(item.key, { folderId: folderId || null })
  }

  const handleNotesBlur = async () => {
    await updateMetadata(item.key, { notes: localNotes || null })
  }

  const toggleLocalTag = async (name: string) => {
    const next = localTags.includes(name)
      ? localTags.filter((t) => t !== name)
      : [...localTags, name]
    setLocalTags(next)
    await updateMetadata(item.key, { tags: next })
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${filename}"?`)) return
    await deleteItem(item.key)
  }

  const showConfirm = (msg: string) => {
    setAssignConfirm(msg)
    setTimeout(() => setAssignConfirm(null), 3000)
  }

  const handleQuickAssign = async (field: 'cover' | 'gallery') => {
    if (!entityContext) {
      setAssignModalOpen(true)
      return
    }
    const apiBase = entityContext.type === 'project'
      ? `/api/admin/projects/${entityContext.id}`
      : `/api/admin/services/${entityContext.id}`

    let body: Record<string, unknown>
    if (field === 'cover') {
      body = entityContext.type === 'project'
        ? { coverImageUrl: item.publicUrl }
        : { imageUrl: item.publicUrl }
    } else {
      const getRes = await fetch(apiBase)
      const current = getRes.ok ? await getRes.json() : {}
      const currentGallery: GalleryItem[] = current.galleryItems ?? current.galleryUrls ?? []
      body = { galleryItems: [...currentGallery, { url: item.publicUrl, order: currentGallery.length }] }
    }
    await fetch(apiBase, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    showConfirm(field === 'cover' ? `Cover updated for "${entityContext.name}" ✓` : `Added to gallery of "${entityContext.name}" ✓`)
  }

  return (
    <>
      <aside
        className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
        style={{ width: 340, backgroundColor: '#16120E', border: '1px solid rgba(226,192,99,0.15)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}
        >
          <h3
            className="text-sm font-semibold truncate pr-2"
            style={{ color: 'var(--neutral-50)', fontFamily: 'var(--font-cormorant)', fontSize: 16 }}
            title={filename}
          >
            {filename}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={item.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg"
              style={{ color: 'var(--neutral-600)' }}
            >
              <ExternalLink size={14} />
            </a>
            <button onClick={closeDetail} className="p-1.5 rounded-lg" style={{ color: 'var(--neutral-600)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div className="flex items-center justify-center" style={{ aspectRatio: '16/9', backgroundColor: '#0D0A08' }}>
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt={filename} className="w-full h-full object-contain" />
            ) : item.mediaType === 'video' ? (
              <video src={item.publicUrl} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-600)' }}>
                <ImageIcon size={28} />
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-5">
            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <MetaField label="Size" value={formatBytes(item.size)} />
              <MetaField label="Format" value={formatMime(item.metadata?.format)} />
              <MetaField
                label="Modified"
                value={new Date(item.lastModified).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              />
              <MetaField
                label="Type"
                value={item.mediaType === 'image' ? 'Image' : item.mediaType === 'video' ? 'Video' : 'Other'}
              />
              {width != null && height != null && (
                <>
                  <MetaField label="Dimensions" value={`${width} × ${height}`} />
                  <MetaField label="Aspect Ratio" value={aspectRatio(width, height)} gold />
                </>
              )}
              {duration != null && (
                <MetaField label="Duration" value={formatDuration(duration)} />
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} />

            {/* Organization */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--neutral-600)' }}>Organization</p>

              <div>
                <label className="text-[10px] block mb-1" style={{ color: '#6B6560' }}>Folder</label>
                <select
                  value={localFolderId}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: 'var(--neutral-50)' }}
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id} style={{ backgroundColor: 'var(--petrol-800)' }}>{f.name}</option>
                  ))}
                </select>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="text-[10px] block mb-1.5" style={{ color: '#6B6560' }}>Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => {
                      const active = localTags.includes(t.name)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleLocalTag(t.name)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                          style={{
                            backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.1)',
                            border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.2)'}`,
                            color: active ? t.color : '#6B6560',
                          }}
                        >
                          {active && <Check size={9} strokeWidth={3} />}
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] block mb-1" style={{ color: '#6B6560' }}>Notes</label>
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={2}
                  placeholder="Internal notes…"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none resize-none"
                  style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: 'var(--neutral-50)' }}
                />
              </div>
            </div>

            {/* URL */}
            <div className="flex items-center gap-2">
              <p
                className="flex-1 text-[10px] font-mono truncate px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(226,192,99,0.05)', color: '#6B6560', border: '1px solid rgba(226,192,99,0.08)' }}
              >
                {item.publicUrl}
              </p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: copied ? 'rgba(82,183,136,0.15)' : 'rgba(226,192,99,0.08)',
                  color: copied ? '#52B788' : 'var(--contigo-primary)',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>

            {/* Used In */}
            {item.usedIn.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--neutral-600)' }}>Used in</p>
                <div className="space-y-1">
                  {item.usedIn.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.08)' }}
                    >
                      <span className="truncate" style={{ color: 'var(--neutral-50)' }}>{a.title}</span>
                      <span
                        className="flex-shrink-0 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ml-2"
                        style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: 'var(--contigo-primary)' }}
                      >
                        {FIELD_LABELS[a.field] ?? a.field}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div
          className="flex-shrink-0 px-4 py-3 space-y-2"
          style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}
        >
          {assignConfirm && (
            <div
              className="text-xs text-center py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(82,183,136,0.15)', color: '#52B788' }}
            >
              {assignConfirm}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAssign('cover')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.12)', border: '1px solid rgba(226,192,99,0.25)', color: 'var(--contigo-primary)' }}
            >
              <ImageIcon size={13} />
              Use as Cover
            </button>
            <button
              type="button"
              onClick={() => handleQuickAssign('gallery')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.12)', border: '1px solid rgba(226,192,99,0.25)', color: 'var(--contigo-primary)' }}
            >
              <ImagePlus size={13} />
              Add to Gallery
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ backgroundColor: 'rgba(232,112,112,0.1)', border: '1px solid rgba(232,112,112,0.2)', color: '#e87070' }}
          >
            <Trash2 size={13} />
            Delete file
          </button>
        </div>
      </aside>

      {assignModalOpen && (
        <AssignToEntityModal
          item={item}
          onClose={() => setAssignModalOpen(false)}
          onAssigned={(_id, _type, field) => {
            showConfirm(field === 'cover' ? 'Assigned as cover ✓' : 'Added to gallery ✓')
          }}
        />
      )}
    </>
  )
}
