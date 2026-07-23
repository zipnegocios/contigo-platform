'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Search, Minus, Plus } from 'lucide-react'
import { isVideoUrl } from '@/presentation/lib/media-type'
import { GalleryThumbnail } from '@/presentation/components/GalleryThumbnail'
import { MagnifierLightboxImage } from '@/presentation/components/MagnifierLightboxImage'
import type { GalleryItem } from '@/types/media'
import { cfImage } from '@/presentation/lib/cloudflareImage'

interface LightboxProps {
  items: GalleryItem[]
  startIndex: number
  onClose: () => void
  variant?: 'default' | 'clean'
}

const MIN_ZOOM = 1.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.5
const DEFAULT_ZOOM = 2

export function Lightbox({ items, startIndex, onClose, variant = 'default' }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const [magnifierOn, setMagnifierOn] = useState(false)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : items.length - 1))
  const next = () => setCurrent((c) => (c < items.length - 1 ? c + 1 : 0))

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock scroll while open
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = prev }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (magnifierOn) return
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (magnifierOn) return
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev()
    touchStartX.current = null
  }

  const item = items[current]
  if (!item) return null

  const isClean = variant === 'clean'
  const isImage = !isVideoUrl(item.url)

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#E8DCC4' }}
        aria-label="Close"
      >
        <X className="w-[clamp(1.25rem,2.2vw,1.5rem)] h-[clamp(1.25rem,2.2vw,1.5rem)]" />
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div
          className="absolute top-5 left-5 text-fluid-sm"
          style={{ color: 'rgba(232,220,196,0.6)' }}
        >
          {current + 1} / {items.length}
        </div>
      )}

      {/* Prev arrow */}
      {items.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 p-3 rounded-full transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E8DCC4' }}
          aria-label="Previous"
        >
          <ChevronLeft className="w-[clamp(1.5rem,2.8vw,1.75rem)] h-[clamp(1.5rem,2.8vw,1.75rem)]" />
        </button>
      )}

      {/* Media */}
      <div
        className="flex flex-col items-center justify-center max-w-[90vw] max-h-[85vh]"
        style={{ width: '100%' }}
      >
        {isVideoUrl(item.url) ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        ) : isClean ? (
          <MagnifierLightboxImage
            key={item.url}
            src={cfImage(item.url, { width: 2000, quality: 80 })}
            alt={item.title || ''}
            magnifierEnabled={magnifierOn}
            zoom={zoom}
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <img
            key={item.url}
            src={cfImage(item.url, { width: 2000, quality: 80 })}
            alt={item.title || ''}
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        )}

        {/* Title / description */}
        {!isClean && (item.title || item.description) && (
          <div className="text-center mt-4 px-6 max-w-xl">
            {item.title && (
              <p
                className="text-fluid-lg font-semibold"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#E2C063' }}
              >
                {item.title}
              </p>
            )}
            {item.description && (
              <p className="text-fluid-sm mt-1" style={{ color: 'rgba(232,220,196,0.7)' }}>
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Magnifier controls */}
        {isClean && isImage && (
          <div
            className="flex items-center gap-3 mt-5 px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1)))}
              disabled={!magnifierOn || zoom <= MIN_ZOOM}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
              style={{ color: '#E8DCC4' }}
              aria-label="Decrease zoom"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMagnifierOn((v) => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: magnifierOn ? '#E2C063' : 'rgba(255,255,255,0.08)',
                color: magnifierOn ? '#1E1A16' : '#E8DCC4',
              }}
              aria-label="Toggle magnifier"
              aria-pressed={magnifierOn}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)))}
              disabled={!magnifierOn || zoom >= MAX_ZOOM}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
              style={{ color: '#E8DCC4' }}
              aria-label="Increase zoom"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Next arrow */}
      {items.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 p-3 rounded-full transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#E8DCC4' }}
          aria-label="Next"
        >
          <ChevronRight className="w-[clamp(1.5rem,2.8vw,1.75rem)] h-[clamp(1.5rem,2.8vw,1.75rem)]" />
        </button>
      )}

      {/* Dot indicators (≤12 items) or thumbnail strip (>12) */}
      {!isClean && items.length > 1 && items.length <= 12 && (
        <div className="absolute bottom-6 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ backgroundColor: i === current ? '#E2C063' : 'rgba(255,255,255,0.25)' }}
              aria-label={`Go to ${i + 1}`}
            />
          ))}
        </div>
      )}

      {!isClean && items.length > 12 && (
        <div className="absolute bottom-4 left-4 right-4 flex gap-1.5 overflow-x-auto pb-1 justify-center">
          {items.map((thumb, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="flex-shrink-0 overflow-hidden rounded transition-all"
              style={{
                width: 'clamp(2.5rem, 6vw, 3.5rem)',
                aspectRatio: '4/3',
                outline: i === current ? '2px solid #E2C063' : '2px solid transparent',
              }}
            >
              <GalleryThumbnail url={thumb.url} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
