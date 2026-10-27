'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import type { PublicReviewDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

interface ReviewsCarouselClientProps {
  reviews: PublicReviewDTO[]
  enableCarousel: boolean
  /** Business reviews page on Google; each card links there in a new tab. */
  googleReviewsUrl?: string
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

/** Small "G" badge marking the review's source. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" role="img" aria-label="Google review">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function ReviewCard({ review, carousel, googleReviewsUrl }: { review: PublicReviewDTO; carousel: boolean; googleReviewsUrl?: string }) {
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
        <div className="flex items-center justify-between gap-3">
          <ReviewStars rating={review.rating} />
          <GoogleMark />
        </div>
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
        {googleReviewsUrl && (
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-fluid-xs underline-offset-4 hover:underline self-start"
            style={{ color: 'var(--contigo-primary)', fontWeight: 600 }}
          >
            Read on Google
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </li>
  )
}

export function ReviewsCarouselClient({ reviews, enableCarousel, googleReviewsUrl }: ReviewsCarouselClientProps) {
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
            ? 'flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
        }
        style={isCarousel ? { scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' } : undefined}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} carousel={isCarousel} googleReviewsUrl={googleReviewsUrl} />
        ))}
      </ul>

      {isCarousel && (
        <>
          <p className="sr-only" role="status" aria-live="polite">
            Review {activeIndex + 1} of {reviews.length}
          </p>
        </>
      )}
    </div>
  )
}
