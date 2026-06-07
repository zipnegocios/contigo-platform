'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryItem } from '@/types/media'

interface LightboxProps {
  items: GalleryItem[]
  startIndex: number
  onClose: () => void
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function Lightbox({ items, startIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

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
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev()
    touchStartX.current = null
  }

  const item = items[current]
  if (!item) return null

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
        className="absolute top-5 right-5 z-10 p-2 rounded-full transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#E8DCC4' }}
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div
          className="absolute top-5 left-5 text-sm"
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
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Media */}
      <div
        className="flex flex-col items-center justify-center max-w-[90vw] max-h-[85vh]"
        style={{ width: '100%' }}
      >
        {isVideo(item.url) ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt={item.title || ''}
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        )}

        {/* Title / description */}
        {(item.title || item.description) && (
          <div className="text-center mt-4 px-6 max-w-xl">
            {item.title && (
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#E2C063' }}
              >
                {item.title}
              </p>
            )}
            {item.description && (
              <p className="text-sm mt-1" style={{ color: 'rgba(232,220,196,0.7)' }}>
                {item.description}
              </p>
            )}
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
          <ChevronRight size={28} />
        </button>
      )}

      {/* Dot indicators (≤12 items) or thumbnail strip (>12) */}
      {items.length > 1 && items.length <= 12 && (
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

      {items.length > 12 && (
        <div className="absolute bottom-4 left-4 right-4 flex gap-1.5 overflow-x-auto pb-1 justify-center">
          {items.map((thumb, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="flex-shrink-0 overflow-hidden rounded transition-all"
              style={{
                width: 44,
                height: 33,
                outline: i === current ? '2px solid #E2C063' : '2px solid transparent',
              }}
            >
              <img src={thumb.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
