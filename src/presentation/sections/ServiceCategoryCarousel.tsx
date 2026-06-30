'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import useEmblaCarousel from 'embla-carousel-react'
import { ServiceIcon } from '@/presentation/components/ServiceIcons'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

export interface ServiceCategoryCarouselItem {
  slug: string
  name: string
  shortDescription: string
  iconKey: string
  imageUrl: string | null
  published: boolean
}

interface Props {
  categorySlug: string
  items: ServiceCategoryCarouselItem[]
}

// Arrow button shared style (mirrors ProjectsSection.tsx pattern)
const arrowBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(30,26,22,0.6)',
  color: '#E2C063',
  border: '1px solid rgba(226,192,99,0.3)',
}

/**
 * Hero + Queue carousel for a single service category.
 *
 * Desktop (≥1024px): Large hero card (image, icon, name, shortDescription, CTA)
 * with a horizontal scrollable queue strip below. Auto-advances every 4.2 s.
 *
 * Mobile (<1024px): Single-card Embla swipeable slider showing full hero cards.
 *
 * Both DOM branches are always mounted (CSS display:none only) for SEO/no-JS.
 * Parent applies `key={category}` so remount resets all state between routes.
 */
export function ServiceCategoryCarousel({ categorySlug, items }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const animatingRef = useRef(false)
  const isPausedRef = useRef(false)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Embla: desktop queue (loop, scroll by card)
  const [emblaQueueRef, emblaQueueApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps',
  })

  // Embla: mobile slider (loop, center)
  const [emblaMobileRef, emblaMobileApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
  })

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + items.length) % items.length)
  }, [items.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % items.length)
  }, [items.length])

  // ── Embla select listener wiring ────────────────────────────────────────────
  useEffect(() => {
    if (!emblaQueueApi) return
    const onSelect = () => {
      setActiveIndex(emblaQueueApi.selectedScrollSnap())
    }
    emblaQueueApi.on('select', onSelect)
    emblaQueueApi.on('reInit', onSelect)
    return () => {
      emblaQueueApi.off('select', onSelect)
      emblaQueueApi.off('reInit', onSelect)
    }
  }, [emblaQueueApi])

  useEffect(() => {
    if (!emblaMobileApi) return
    const onSelect = () => {
      setActiveIndex(emblaMobileApi.selectedScrollSnap())
    }
    emblaMobileApi.on('select', onSelect)
    emblaMobileApi.on('reInit', onSelect)
    return () => {
      emblaMobileApi.off('select', onSelect)
      emblaMobileApi.off('reInit', onSelect)
    }
  }, [emblaMobileApi])

  // ── Sync Embla scroll position when activeIndex changes externally ──────────
  useEffect(() => {
    emblaQueueApi?.scrollTo(activeIndex, true)
  }, [activeIndex, emblaQueueApi])

  useEffect(() => {
    emblaMobileApi?.scrollTo(activeIndex, true)
  }, [activeIndex, emblaMobileApi])

  // ── GSAP hero crossfade on activeIndex change ────────────────────────────────
  // Only fires after first mount (skip initial render).
  const didMountHeroRef = useRef(false)

  useLayoutEffect(() => {
    if (!didMountHeroRef.current) {
      didMountHeroRef.current = true
      return
    }
    if (!heroContentRef.current) return

    if (prefersReducedMotion()) {
      // Instant swap — no animation
      animatingRef.current = false
      return
    }

    if (animatingRef.current) return
    animatingRef.current = true

    const el = heroContentRef.current

    // Phase 1: fade OUT
    gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        // Phase 2: fade IN (React already rendered new content since state updated)
        gsap.fromTo(
          el,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
            onComplete: () => {
              animatingRef.current = false
            },
          },
        )
      },
    })
  }, [activeIndex])

  // ── Entrance stagger on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const cards = rootRef.current?.querySelectorAll('.svc-queue-card')
      if (cards && cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.07,
            clearProps: 'opacity,transform',
          },
        )
      }
    }, rootRef)

    return () => ctx.revert()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug])

  // ── Auto-advance timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion()) return
    if (items.length <= 1) return

    const id = setInterval(() => {
      if (!isPausedRef.current) {
        setActiveIndex((i) => (i + 1) % items.length)
      }
    }, 4200)

    return () => clearInterval(id)
  }, [activeIndex, items.length])

  // ── Hover/focus pause handlers ──────────────────────────────────────────────
  const pauseCarousel = useCallback(() => {
    isPausedRef.current = true
  }, [])

  const resumeCarousel = useCallback(() => {
    isPausedRef.current = false
  }, [])

  const handleBlurOutside = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Only resume if focus has truly left the carousel root
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      isPausedRef.current = false
    }
  }, [])

  const handleFocusInside = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // No-op when focus moves between internal elements; only pause when entering from outside
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    pauseCarousel()
  }, [pauseCarousel])

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    },
    [goPrev, goNext],
  )

  if (items.length === 0) return null

  const activeItem = items[activeIndex]

  // ── Render helpers ──────────────────────────────────────────────────────────

  /** Full hero card content — used by desktop hero slot and each mobile slide */
  function renderHeroContent(item: ServiceCategoryCarouselItem, isActive = true) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ minHeight: '55vh', backgroundColor: '#1E1A16' }}>
        {/* Background image */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(30,26,22,0) 0%, rgba(30,26,22,0.85) 100%)',
          }}
        />
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12" style={{ minHeight: '55vh' }}>
          {/* Icon with data-active for self-draw CSS trigger */}
          <div className="svc-carousel-hero" data-active={isActive || undefined}>
            <span className="inline-block mb-4" style={{ color: '#E2C063' }}>
              <ServiceIcon name={item.iconKey} className="w-12 h-12" />
            </span>
          </div>

          <h2
            className="text-fluid-4xl font-semibold leading-tight mb-3"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
          >
            {item.name}
          </h2>

          <p
            className="text-fluid-base max-w-xl leading-relaxed mb-6"
            style={{ color: '#A89E8C' }}
          >
            {item.shortDescription}
          </p>

          {item.published && (
            <Link
              href={`/services/${categorySlug}/${item.slug}`}
              className="inline-flex items-center gap-2 text-fluid-sm uppercase tracking-widest font-medium transition-opacity hover:opacity-70"
              style={{ color: '#E2C063' }}
            >
              View full details
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  /** Compact queue card — image + icon + name, no description or CTA */
  function renderQueueCard(item: ServiceCategoryCarouselItem, isActive: boolean, index: number) {
    return (
      <button
        key={item.slug}
        onClick={() => setActiveIndex(index)}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`View ${item.name}`}
        className="svc-queue-card shrink-0 relative rounded-xl overflow-hidden transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          flex: '0 0 clamp(120px, 22vw, 180px)',
          aspectRatio: '3/4',
          backgroundColor: '#1E1A16',
          border: isActive
            ? '2px solid #E2C063'
            : '1px solid rgba(226,192,99,0.2)',
        }}
      >
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(30,26,22,0) 30%, rgba(30,26,22,0.9) 100%)',
          }}
        />
        {/* Icon */}
        <span
          className="absolute top-3 left-3"
          style={{ color: isActive ? '#E2C063' : '#A89E8C' }}
        >
          <ServiceIcon name={item.iconKey} className="w-6 h-6" />
        </span>
        {/* Name */}
        <span
          className="absolute bottom-3 left-3 right-3 text-left text-fluid-xs leading-tight"
          style={{
            fontFamily: 'var(--font-cormorant)',
            color: isActive ? '#FAF6F0' : '#A89E8C',
            fontWeight: 500,
          }}
        >
          {item.name}
        </span>
      </button>
    )
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={pauseCarousel}
      onMouseLeave={resumeCarousel}
      onFocus={handleFocusInside}
      onBlur={handleBlurOutside}
      onKeyDownCapture={handleKeyDownCapture}
    >
      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {activeItem.name}
      </div>

      {/* ── Desktop/tablet: hero + queue (≥1024px) ──────────────────────────── */}
      <div className="hidden lg:flex flex-col gap-6">
        {/* Hero */}
        <div className="relative">
          <div ref={heroContentRef}>
            {renderHeroContent(activeItem)}
          </div>

          {/* Prev/next arrows — overlaid on hero */}
          <div className="absolute bottom-6 right-6 flex gap-2 z-20">
            <button
              onClick={goPrev}
              aria-label="Previous service"
              className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex items-center justify-center text-fluid-xl transition-opacity hover:opacity-80"
              style={arrowBtnStyle}
            >
              ‹
            </button>
            <button
              onClick={goNext}
              aria-label="Next service"
              className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex items-center justify-center text-fluid-xl transition-opacity hover:opacity-80"
              style={arrowBtnStyle}
            >
              ›
            </button>
          </div>
        </div>

        {/* Queue strip */}
        <div ref={emblaQueueRef} className="overflow-hidden">
          <div className="flex gap-3">
            {items.map((item, i) => renderQueueCard(item, i === activeIndex, i))}
          </div>
        </div>
      </div>

      {/* ── Mobile: single-card Embla slider (<1024px) ──────────────────────── */}
      <div className="lg:hidden">
        <div ref={emblaMobileRef} className="overflow-hidden">
          <div className="flex">
            {items.map((item, i) => (
              <div
                key={item.slug}
                role="group"
                aria-roledescription="slide"
                className="min-w-0 shrink-0 grow-0 basis-full"
              >
                {renderHeroContent(item, i === activeIndex)}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile prev/next arrows */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={goPrev}
            aria-label="Previous service"
            className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex items-center justify-center text-fluid-xl transition-opacity hover:opacity-80"
            style={arrowBtnStyle}
          >
            ‹
          </button>
          <button
            onClick={goNext}
            aria-label="Next service"
            className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex items-center justify-center text-fluid-xl transition-opacity hover:opacity-80"
            style={arrowBtnStyle}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
