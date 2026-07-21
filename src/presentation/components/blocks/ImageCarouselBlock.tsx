'use client'
import { useRef } from 'react'
import type { ImageCarouselBlockData } from '@/types/pageBlocks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cfImage } from '@/presentation/lib/cloudflareImage'

interface ImageCarouselBlockProps { data: ImageCarouselBlockData }

export function ImageCarouselBlock({ data }: ImageCarouselBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (data.images.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(45,41,36,0.7)', color: '#FAF6F0' }}
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {data.images.map((img, idx) => (
            <div key={idx} className="flex-shrink-0 w-72">
              <img
                src={cfImage(img.url, { width: 1200 })}
                alt={img.caption || ''}
                className="w-full h-48 object-cover rounded-lg"
                style={{ border: '1px solid #E5DDD0' }}
              />
              {img.caption && (
                <p className="text-fluid-xs mt-2 text-center" style={{ color: '#9C8F83' }}>{img.caption}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(45,41,36,0.7)', color: '#FAF6F0' }}
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  )
}
