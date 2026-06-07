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
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {items.map((item, i) =>
            isVideo(item.url) ? (
              <div
                key={i}
                className="overflow-hidden rounded-lg"
                style={{ backgroundColor: '#1E1A16', aspectRatio: '16/9' }}
              >
                <video
                  src={item.url}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 8 }}
                />
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(imageItems.indexOf(item))}
                className="overflow-hidden rounded-lg text-left group cursor-pointer"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={item.url}
                  alt={item.title || `Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
