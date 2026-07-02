'use client'

import { type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
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
  className?: string
  style?: CSSProperties
  /** Controlled flip state — only one card section-wide is ever flipped, so
   *  the parent (not local state) owns which card is open. */
  isFlipped: boolean
  /** Toggles this card open/closed. The parent decides what that means
   *  globally (opening this one closes whichever other card was open). */
  onToggle: () => void
}

export default function FlippableServiceCard({
  slug,
  name,
  imageUrl,
  categorySlug,
  categoryName,
  className,
  style,
  isFlipped,
  onToggle,
}: FlippableServiceCardProps) {
  const handleFrontClick = () => {
    if (!isFlipped) {
      onToggle()
    }
  }

  const handleBackClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('a')) {
      return
    }
    event.stopPropagation()
    onToggle()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const target = event.target
    if (target instanceof Element && target.closest('a')) {
      return
    }
    event.preventDefault()
    onToggle()
  }

  return (
    <div className={`service-flip-perspective ${className ?? ''}`} style={style}>
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
            draggable={false}
            sizes="(max-width: 1024px) 82vw, 420px"
            style={{ objectFit: 'cover' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(5,30,39,0.78), transparent 60%)',
            }}
          />
          <span
            className="absolute bottom-3 left-4 right-4 text-white font-medium text-fluid-sm leading-snug"
            style={{ fontFamily: 'var(--font-alegreya-sans)' }}
          >
            {name}
          </span>
        </div>

        {/* Back face */}
        <div
          className="service-flip-face service-flip-face--back flex flex-col justify-center gap-1.5 px-5 py-4"
          style={{
            background: `linear-gradient(rgba(5,30,39,0.86), rgba(9,43,56,0.86)), url(${imageUrl}) center/cover`,
          }}
        >
          <span
            className="label"
            style={{ color: 'var(--contigo-primary)' }}
          >
            {categoryName}
          </span>
          <h3
            className="text-fluid-base leading-tight"
            style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--neutral-50)' }}
          >
            {name}
          </h3>
          <Link
            href={`/services/${categorySlug}/${slug}`}
            className="inline-flex items-center gap-2 mt-1 text-fluid-sm font-medium"
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
