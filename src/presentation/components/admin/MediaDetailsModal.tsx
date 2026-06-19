'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Film, Image, Maximize2 } from 'lucide-react'
import type { AssociationInfo, MediaMetadata } from '@/types/media'
import { aspectRatio, formatDuration } from '@/presentation/lib/extractMediaMetadata'

interface MediaDetailsModalProps {
  item: {
    key: string
    size: number
    lastModified: string
    publicUrl: string
    mediaType: 'image' | 'video' | 'other'
    usedIn: AssociationInfo[]
    metadata?: MediaMetadata | null
  }
  onClose: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatMime(format: string | null | undefined): string {
  if (!format) return '—'
  // Convert mime to short label
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/avif': 'AVIF',
    'image/svg+xml': 'SVG',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'video/ogg': 'OGG',
    'video/quicktime': 'MOV',
  }
  return map[format] ?? format.split('/')[1]?.toUpperCase() ?? format
}

const FIELD_LABELS: Record<AssociationInfo['field'], string> = {
  cover: 'Cover',
  gallery: 'Gallery',
  poster: 'Poster',
  image: 'Image',
}

export function MediaDetailsModal({ item, onClose }: MediaDetailsModalProps) {
  const [copied, setCopied] = useState(false)
  // Lazily extracted dimensions for items without DB metadata
  const [measuredDims, setMeasuredDims] = useState<{ width: number; height: number } | null>(null)
  const [measuredDuration, setMeasuredDuration] = useState<number | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const dbMeta = item.metadata
  const hasDbDimensions = dbMeta?.width != null && dbMeta?.height != null
  const hasDbDuration = dbMeta?.duration != null

  // Lazily extract dimensions from the media URL if not in DB
  useEffect(() => {
    if (hasDbDimensions) return
    if (item.mediaType === 'image') {
      setMeasuring(true)
      const img = document.createElement('img')
      img.onload = () => {
        setMeasuredDims({ width: img.naturalWidth, height: img.naturalHeight })
        setMeasuring(false)
      }
      img.onerror = () => setMeasuring(false)
      img.src = item.publicUrl
    }
  }, [item.publicUrl, item.mediaType, hasDbDimensions])

  useEffect(() => {
    if (hasDbDuration) return
    if (item.mediaType === 'video') {
      setMeasuring(true)
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        if (isFinite(video.duration)) setMeasuredDuration(Math.round(video.duration))
        if (!hasDbDimensions && video.videoWidth) setMeasuredDims({ width: video.videoWidth, height: video.videoHeight })
        setMeasuring(false)
      }
      video.onerror = () => setMeasuring(false)
      video.src = item.publicUrl
    }
  }, [item.publicUrl, item.mediaType, hasDbDuration, hasDbDimensions])

  const width = dbMeta?.width ?? measuredDims?.width ?? null
  const height = dbMeta?.height ?? measuredDims?.height ?? null
  const duration = dbMeta?.duration ?? measuredDuration ?? null
  const format = dbMeta?.format ?? null

  const handleCopy = () => {
    navigator.clipboard.writeText(item.publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filename = item.key.split('/').pop() ?? item.key

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-2xl max-w-lg w-full overflow-hidden"
        style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}
        >
          <h2 className="text-fluid-base font-semibold truncate pr-4" style={{ color: 'var(--neutral-50)', fontFamily: 'var(--font-cormorant)' }}>
            {filename}
          </h2>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg min-h-[44px] min-w-[44px]" style={{ color: 'var(--neutral-600)' }}>
            <X className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 pt-5">
          <div
            className="rounded-xl overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: '16/9', backgroundColor: '#150F0A' }}
          >
            {item.mediaType === 'image' ? (
              <img src={item.publicUrl} alt={filename} className="w-full h-full object-contain" />
            ) : item.mediaType === 'video' ? (
              <video src={item.publicUrl} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2" style={{ color: 'var(--neutral-600)' }}>
                <Image className="w-[clamp(1.75rem,3.5vw,2.25rem)] h-[clamp(1.75rem,3.5vw,2.25rem)]" />
                <span className="text-fluid-xs">No preview</span>
              </div>
            )}
          </div>
        </div>

        {/* File info */}
        <div className="px-6 py-4 space-y-4">
          {/* Basic info grid */}
          <div className="grid grid-cols-2 gap-3 text-fluid-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--neutral-600)' }}>Size</p>
              <p style={{ color: 'var(--neutral-50)' }}>{formatBytes(item.size)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--neutral-600)' }}>Format</p>
              <p style={{ color: 'var(--neutral-50)' }}>{formatMime(format) || <span style={{ color: '#6B6560' }}>Unknown</span>}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--neutral-600)' }}>Last Modified</p>
              <p style={{ color: 'var(--neutral-50)' }}>
                {new Date(item.lastModified).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--neutral-600)' }}>Type</p>
              <p style={{ color: 'var(--neutral-50)' }} className="capitalize">{item.mediaType}</p>
            </div>
          </div>

          {/* Dimensions + aspect ratio */}
          {(width != null || measuring) && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
            >
              <Maximize2 className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" style={{ color: 'var(--contigo-primary)', flexShrink: 0 }} />
              {measuring && !width ? (
                <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>Measuring…</span>
              ) : width && height ? (
                <div className="flex items-center gap-3 text-fluid-sm flex-wrap">
                  <span style={{ color: 'var(--neutral-50)' }}>{width} × {height}px</span>
                  <span className="text-fluid-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: 'var(--contigo-primary)' }}>
                    {aspectRatio(width, height)}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Duration (video only) */}
          {item.mediaType === 'video' && duration != null && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.1)' }}
            >
              <Film className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" style={{ color: 'var(--contigo-primary)', flexShrink: 0 }} />
              <span className="text-fluid-sm" style={{ color: 'var(--neutral-50)' }}>Duration: {formatDuration(duration)}</span>
            </div>
          )}

          {/* Notes */}
          {dbMeta?.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--neutral-600)' }}>Notes</p>
              <p className="text-fluid-sm" style={{ color: 'var(--neutral-50)' }}>{dbMeta.notes}</p>
            </div>
          )}

          {/* URL + copy */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--neutral-600)' }}>Public URL</p>
            <div className="flex items-center gap-2">
              <p
                className="text-fluid-xs flex-1 min-w-0 truncate font-mono px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', color: 'var(--neutral-600)', border: '1px solid rgba(226,192,99,0.1)' }}
              >
                {item.publicUrl}
              </p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg transition-all min-h-[44px] min-w-[44px]"
                style={{
                  backgroundColor: copied ? 'rgba(82,183,136,0.15)' : 'rgba(226,192,99,0.1)',
                  color: copied ? '#52B788' : 'var(--contigo-primary)',
                }}
                title="Copy URL"
              >
                {copied ? <Check className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" /> : <Copy className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
              </button>
            </div>
          </div>

          {/* Associations */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--neutral-600)' }}>Used In</p>
            {item.usedIn.length === 0 ? (
              <p className="text-fluid-sm" style={{ color: '#6B6560' }}>Unassigned</p>
            ) : (
              <div className="space-y-1.5">
                {item.usedIn.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-fluid-sm"
                    style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.08)' }}
                  >
                    <span style={{ color: 'var(--neutral-50)' }}>{a.title}</span>
                    <span
                      className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: 'var(--contigo-primary)' }}
                    >
                      {FIELD_LABELS[a.field]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
