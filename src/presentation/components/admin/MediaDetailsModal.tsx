'use client'

import { useState } from 'react'
import { X, Copy, Check, Film, Image } from 'lucide-react'
import type { AssociationInfo } from '@/types/media'

interface MediaDetailsModalProps {
  item: {
    key: string
    size: number
    lastModified: string
    publicUrl: string
    mediaType: 'image' | 'video' | 'other'
    usedIn: AssociationInfo[]
  }
  onClose: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const FIELD_LABELS: Record<AssociationInfo['field'], string> = {
  cover: 'Cover',
  gallery: 'Gallery',
  poster: 'Poster',
  image: 'Image',
}

export function MediaDetailsModal({ item, onClose }: MediaDetailsModalProps) {
  const [copied, setCopied] = useState(false)

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
        style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}
        >
          <h2 className="text-base font-semibold truncate pr-4" style={{ color: '#E8DCC4', fontFamily: 'var(--font-cormorant)' }}>
            {filename}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
            style={{ color: '#A89E8C' }}
          >
            <X size={18} />
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
              <div className="flex flex-col items-center gap-2" style={{ color: '#A89E8C' }}>
                <Image size={36} />
                <span className="text-xs">No preview</span>
              </div>
            )}
          </div>
        </div>

        {/* File info */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>Size</p>
              <p style={{ color: '#E8DCC4' }}>{formatBytes(item.size)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>Type</p>
              <p style={{ color: '#E8DCC4' }} className="capitalize">{item.mediaType}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A89E8C' }}>Last Modified</p>
              <p style={{ color: '#E8DCC4' }}>
                {new Date(item.lastModified).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* URL + copy */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#A89E8C' }}>Public URL</p>
            <div className="flex items-center gap-2">
              <p
                className="text-xs flex-1 min-w-0 truncate font-mono px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(226,192,99,0.06)', color: '#A89E8C', border: '1px solid rgba(226,192,99,0.1)' }}
              >
                {item.publicUrl}
              </p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg transition-all"
                style={{ backgroundColor: copied ? 'rgba(82,183,136,0.15)' : 'rgba(226,192,99,0.1)', color: copied ? '#52B788' : '#E2C063' }}
                title="Copy URL"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Associations */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#A89E8C' }}>Used In</p>
            {item.usedIn.length === 0 ? (
              <p className="text-sm" style={{ color: '#6B6560' }}>Unassigned</p>
            ) : (
              <div className="space-y-1.5">
                {item.usedIn.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.08)' }}
                  >
                    <span style={{ color: '#E8DCC4' }}>{a.title}</span>
                    <span
                      className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#E2C063' }}
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
