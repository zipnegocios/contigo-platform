'use client'

import { useState } from 'react'
import { Play, Film } from 'lucide-react'
import { isVideoUrl } from '@/presentation/lib/media-type'

/**
 * Shared thumbnail renderer for gallery items (images and videos) — used by
 * the admin project form's gallery strip, the Gallery Manager modal, and the
 * public lightbox's thumbnail strip, so video-preview behavior stays
 * consistent instead of duplicated per call site.
 */
export function GalleryThumbnail({ url, className }: { url: string; className?: string }) {
  const [videoError, setVideoError] = useState(false)
  const boxClassName = className ?? 'w-full h-full object-cover'

  if (!isVideoUrl(url)) {
    return <img src={url} alt="" className={boxClassName} />
  }

  if (videoError) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#150F0A' }}>
        <Film className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" style={{ color: 'var(--neutral-600)' }} />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* First frame as poster — cheap, client-side, no stored/generated poster needed */}
      <video src={url} muted preload="metadata" playsInline className={boxClassName} onError={() => setVideoError(true)} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <Play className="w-4 h-4 fill-white text-white" />
      </div>
    </div>
  )
}
