'use client'

import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface FlippableServiceCardProps {
  slug: string
  name: string
  imageUrl: string
  categorySlug: string
  categoryName: string
  loopKey?: string
  style?: CSSProperties
}

export default function FlippableServiceCard({
  slug,
  name,
  imageUrl,
  categorySlug,
  categoryName,
  style,
}: FlippableServiceCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFrontClick = () => {
    if (!isFlipped) {
      setIsFlipped(true)
    }
  }

  const handleBackClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('a')) {
      return
    }
    event.stopPropagation()
    setIsFlipped(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const target = event.target
    if (target instanceof Element && target.closest('a')) {
      return
    }
    event.preventDefault()
    setIsFlipped((prev) => !prev)
  }

  return (
    <div className="service-flip-perspective" style={style}>
      <div
        className={`service-flip-inner ${isFlipped ? 'is-flipped' : ''}`}
        onClick={isFlipped ? handleBackClick : handleFrontClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? `Show ${name} image` : `Show details for ${name}`}
      >
        {/* Front face */}
        <div className="service-flip-face service-flip-face--front">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="320px"
            style={{ objectFit: 'cover' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(5,30,39,0.75), transparent 55%)',
            }}
          />
          <span
            className="absolute bottom-4 left-4 right-4 text-white font-medium"
            style={{ fontFamily: 'var(--font-alegreya-sans)' }}
          >
            {name}
          </span>
        </div>

        {/* Back face */}
        <div
          className="service-flip-face service-flip-face--back"
          style={{
            background: `linear-gradient(rgba(5,30,39,0.85), rgba(9,43,56,0.85)), url(${imageUrl}) center/cover`,
          }}
        >
          <span
            className="label block mb-2"
            style={{ color: 'var(--contigo-primary)' }}
          >
            {categoryName}
          </span>
          <h3 style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--neutral-50)' }}>
            {name}
          </h3>
          <Link
            href={`/services/${categorySlug}/${slug}`}
            className="inline-flex items-center gap-2 mt-4"
            style={{ color: 'var(--contigo-primary)' }}
          >
            View Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
