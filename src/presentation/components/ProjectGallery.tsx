'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { Lightbox } from '@/presentation/components/Lightbox'
import { isVideoUrl } from '@/presentation/lib/media-type'
import type { GalleryItem } from '@/types/media'
import { cfImage } from '@/presentation/lib/cloudflareImage'

export function ProjectGallery({ items }: { items: GalleryItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <>
      <div>
        <h2
          className="text-fluid-2xl font-semibold mb-6"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
        >
          Gallery
        </h2>

        {/*
          CSS columns masonry — each item renders at its natural aspect ratio.
          Breakpoints:
            mobile  (<640px):  1 column
            sm      (640px+):  2 columns
            lg      (1024px+): 3 columns
        */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
          {items.map((item, i) => {
            const video = isVideoUrl(item.url)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="break-inside-avoid mb-3 block w-full overflow-hidden rounded-xl text-left group cursor-pointer relative"
                style={video ? { backgroundColor: '#1E1A16', aspectRatio: '16/9' } : undefined}
              >
                {video ? (
                  <>
                    <video
                      src={item.url}
                      muted
                      preload="metadata"
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <Play className="w-8 h-8 fill-white text-white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={cfImage(item.url, { width: 800 })}
                    alt={item.title || `Gallery ${i + 1}`}
                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
