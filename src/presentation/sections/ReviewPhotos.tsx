'use client'

import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PublicReviewPhotoDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

const MAX_THUMBS = 3

interface ThumbsProps {
  photos: PublicReviewPhotoDTO[]
  onOpen: (index: number) => void
}

/** Up to three square thumbnails; the last one shows "+N" when there are more. */
export function ReviewPhotoThumbs({ photos, onOpen }: ThumbsProps) {
  const shown = photos.slice(0, MAX_THUMBS)
  const extra = photos.length - shown.length
  const names = Array.from(new Set(photos.map((p) => p.attributionName).filter(Boolean)))

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {shown.map((photo, i) => (
          <button
            key={photo.url}
            type="button"
            onClick={() => onOpen(i)}
            className="relative aspect-square overflow-hidden rounded-md focus-visible:outline focus-visible:outline-2"
            style={{ outlineColor: 'var(--gold-400)' }}
            aria-label={`View photo ${i + 1} of ${photos.length}`}
          >
            <img
              src={photo.thumbnailUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {i === shown.length - 1 && extra > 0 && (
              <span
                className="absolute inset-0 flex items-center justify-center text-fluid-sm font-semibold"
                style={{ background: 'rgba(18,14,10,0.55)', color: '#FAF6F0' }}
              >
                +{extra}
              </span>
            )}
          </button>
        ))}
      </div>
      {names.length > 0 && (
        <p className="text-fluid-xs mt-1.5" style={{ color: 'var(--neutral-500)' }}>
          Photos by {names.join(', ')} · via Google
        </p>
      )}
    </div>
  )
}

interface LightboxProps {
  photos: PublicReviewPhotoDTO[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function ReviewPhotoLightbox({ photos, index, onIndexChange, onClose }: LightboxProps) {
  const photo = photos[index]
  const step = useCallback(
    (delta: number) => onIndexChange((index + delta + photos.length) % photos.length),
    [index, photos.length, onIndexChange],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, step])

  if (!photo) return null

  const navBtn = 'absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full'
  const navStyle: React.CSSProperties = { width: 44, height: 44, background: 'rgba(250,246,240,0.12)', color: '#FAF6F0' }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review photo"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      style={{ background: 'rgba(18,14,10,0.92)' }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center rounded-full"
        style={navStyle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <img
        src={photo.url}
        alt={photo.attributionName ? `Photo by ${photo.attributionName}` : 'Review photo'}
        referrerPolicy="no-referrer"
        className="max-w-full rounded-lg object-contain"
        style={{ maxHeight: 'calc(100vh - 8rem)' }}
        onClick={(e) => e.stopPropagation()}
      />

      <p className="mt-3 text-fluid-sm text-center" style={{ color: 'rgba(250,246,240,0.85)' }} onClick={(e) => e.stopPropagation()}>
        {photo.attributionName && (
          <>
            Photo by{' '}
            {photo.attributionProfileUrl ? (
              <a href={photo.attributionProfileUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {photo.attributionName}
              </a>
            ) : (
              photo.attributionName
            )}{' '}
            · via Google ·{' '}
          </>
        )}
        {index + 1} / {photos.length}
      </p>

      {photos.length > 1 && (
        <>
          <button type="button" aria-label="Previous photo" className={`${navBtn} left-4`} style={navStyle} onClick={(e) => { e.stopPropagation(); step(-1) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button type="button" aria-label="Next photo" className={`${navBtn} right-4`} style={navStyle} onClick={(e) => { e.stopPropagation(); step(1) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
