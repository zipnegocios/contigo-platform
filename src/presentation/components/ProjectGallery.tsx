'use client'

import { useState } from 'react'
import { Lightbox } from '@/presentation/components/Lightbox'
import type { GalleryItem } from '@/types/media'

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export function ProjectGallery({ items }: { items: GalleryItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  const imageItems = items.filter((it) => !isVideo(it.url))

  return (
    <>
      <div>
        <h2
          className="text-2xl font-semibold mb-6"
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
          {items.map((item, i) =>
            isVideo(item.url) ? (
              <div
                key={i}
                className="break-inside-avoid mb-3 overflow-hidden rounded-xl"
                style={{ backgroundColor: '#1E1A16', aspectRatio: '16/9' }}
              >
                <video
                  src={item.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(imageItems.indexOf(item))}
                className="break-inside-avoid mb-3 block w-full overflow-hidden rounded-xl text-left group cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.title || `Gallery ${i + 1}`}
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ),
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={imageItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
