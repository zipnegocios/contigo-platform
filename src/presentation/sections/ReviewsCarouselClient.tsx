'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import type { PublicReviewDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

interface ReviewsCarouselClientProps {
  reviews: PublicReviewDTO[]
  enableCarousel: boolean
}

const AUTOPLAY_INTERVAL_MS = 5000

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? 'var(--gold-400)' : 'none'}
          stroke="var(--gold-400)"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review, carousel }: { review: PublicReviewDTO; carousel: boolean }) {
  return (
    <li
      className={carousel ? 'flex-shrink-0 w-[300px] sm:w-[340px]' : ''}
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="h-full flex flex-col gap-3 rounded-xl"
        style={{
          backgroundColor: 'var(--neutral-0, #fff)',
          border: '1px solid var(--gold-a15)',
          padding: 'clamp(1.25rem, 2.5vw, 1.75rem)',
        }}
      >
        <ReviewStars rating={review.rating} />
        {review.comment && (
          <p className="text-fluid-sm" style={{ color: 'var(--neutral-700)', lineHeight: 1.6 }}>
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-2">
          {review.reviewerAvatarUrl && (
            <img src={review.reviewerAvatarUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
          )}
          <div>
            {review.reviewerName && (
              <p className="text-fluid-sm font-semibold" style={{ color: 'var(--petrol-800)' }}>
                {review.reviewerName}
              </p>
            )}
            {review.reviewCreatedAt && (
              <p className="text-fluid-xs" style={{ color: 'var(--neutral-500)' }}>
                {new Date(review.reviewCreatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function ReviewsCarouselClient({ reviews, enableCarousel }: ReviewsCarouselClientProps) {
  const containerRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCarousel, setIsCarousel] = useState(false)
  const pausedRef = useRef(false)

  // Enhance into a carousel only after mount, and only when motion is allowed —
  // the server-rendered grid is the no-JS / reduced-motion fallback (plan Phase 4).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only upgrade from the SSR grid fallback to the carousel, not a state sync
    if (enableCarousel && !prefersReducedMotion()) setIsCarousel(true)
  }, [enableCarousel])

  const goTo = useCallback((index: number) => {
    const el = containerRef.current
    if (!el) return
    const clamped = (index + reviews.length) % reviews.length
    const card = el.children[clamped] as HTMLElement | undefined
    if (!card) return
    gsap.to(el, { scrollLeft: card.offsetLeft, duration: 0.6, ease: 'power2.inOut' })
    setActiveIndex(clamped)
  }, [reviews.length])

  useEffect(() => {
    if (!isCarousel) return
    const interval = setInterval(() => {
      if (!pausedRef.current) goTo(activeIndex + 1)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isCarousel, activeIndex, goTo])

  if (reviews.length === 0) return null

  return (
    <div
      role={isCarousel ? 'region' : undefined}
      aria-roledescription={isCarousel ? 'carousel' : undefined}
      aria-label={isCarousel ? 'Client reviews' : undefined}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onFocus={() => { pausedRef.current = true }}
      onBlur={() => { pausedRef.current = false }}
    >
      <ul
        ref={containerRef}
        className={
          isCarousel
            ? 'flex gap-5 overflow-x-auto pb-2'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
        }
        style={isCarousel ? { scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' } : undefined}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} carousel={isCarousel} />
        ))}
      </ul>

      {isCarousel && (
        <>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              aria-label="Previous review"
              onClick={() => goTo(activeIndex - 1)}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ width: 42, height: 42, border: '1.5px solid var(--gold-a30)', color: 'var(--petrol-800)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next review"
              onClick={() => goTo(activeIndex + 1)}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ width: 42, height: 42, border: '1.5px solid var(--gold-a30)', color: 'var(--petrol-800)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            Review {activeIndex + 1} of {reviews.length}
          </p>
        </>
      )}
    </div>
  )
}
