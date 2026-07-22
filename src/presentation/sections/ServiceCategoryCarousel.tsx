'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ServiceIcon } from '@/presentation/components/ServiceIcons'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import { SERVICE_ROOT_SLUGS, SERVICE_ROOT_NAMES } from '@/presentation/data/serviceCategoryMeta'

export interface VisibleServiceCategory {
  slug: string
  name: string
}
import { cfImage } from '@/presentation/lib/cloudflareImage'

export interface ServiceCategoryCarouselItem {
  slug: string
  name: string
  shortDescription: string
  iconKey: string
  imageUrl: string | null
}

interface Props {
  items: ServiceCategoryCarouselItem[]
  categorySlug: string
  categoryName: string
  rootCategoryNames?: Record<string, string>
  visibleCategories?: VisibleServiceCategory[]
  tagline: string
}

// Reference: docs/temporal-service-cards/src/script.js (Timed Cards Opening)
// Queue thumbnail sizing is proportional to the viewport (half of the original
// fixed-px values, then bumped 20% back up: 200/300/40 → 100/150/20 → 120/180/24px
// at a 1920×1080 reference screen) so relative card size stays consistent
// across screen sizes instead of being pinned to an absolute pixel count.
const CARD_W_VW = 6.25  // 120px @ 1920px wide
const CARD_H_VH = 16.7  // 180px @ 1080px tall
const GAP_VW = 1.25     // 24px @ 1920px wide
const RIGHT_MARGIN_VW = 2.6 // gap between queue row and the container's right edge (~50px @ 1920)
const PROGRESS_W = 260
const EASE = 'sine.inOut'
// Max thumbnails shown in the queue row at once. Slots beyond this stay
// parked off-screen (same as cards waiting to enter) until they rotate in.
const MAX_QUEUE_VISIBLE = 6

function cardWPx() { return window.innerWidth * (CARD_W_VW / 100) }
function cardHPx() { return window.innerHeight * (CARD_H_VH / 100) }
function gapPx() { return window.innerWidth * (GAP_VW / 100) }
function rightMarginPx() { return window.innerWidth * (RIGHT_MARGIN_VW / 100) }

export function ServiceCategoryCarousel({ items, categorySlug, categoryName, rootCategoryNames, visibleCategories, tagline }: Props) {
  const n = items.length
  const navCategories: VisibleServiceCategory[] =
    visibleCategories ?? SERVICE_ROOT_SLUGS.map((slug) => ({ slug, name: SERVICE_ROOT_NAMES[slug] }))
  const pathname = usePathname()

  // Mutable rotation refs — no re-render during animation
  const orderRef = useRef<number[]>(items.map((_, i) => i))
  const animatingRef = useRef(false)
  const isPausedRef = useRef(false)
  const mountedRef = useRef(false)
  const loopRunningRef = useRef(false)
  const isEvenActiveRef = useRef(true) // tracks which details panel is currently visible

  // React state — drives JSX content of the two alternating details panels
  const [evenContent, setEvenContent] = useState<ServiceCategoryCarouselItem>(items[0])
  const [oddContent, setOddContent] = useState<ServiceCategoryCarouselItem>(items[Math.min(1, n - 1)])
  const [mobileIdx, setMobileIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const manualPauseRef = useRef(false)

  // Layout (computed on mount from actual DOM measurements)
  const layoutRef = useRef({ w: 0, h: 0, offsetTop: 0, cardW: 0, cardH: 0, gap: 0, rightMargin: 0, tabsTop: 0, controlsTop: 0 })

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const progressFgRef = useRef<HTMLDivElement>(null)
  const slideCounterRef = useRef<HTMLSpanElement>(null)
  const detailsEvenRef = useRef<HTMLDivElement>(null)
  const detailsOddRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardQueueContentRefs = useRef<(HTMLDivElement | null)[]>([])
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const desktopTabsRef = useRef<HTMLElement>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function computeLayout() {
    const el = containerRef.current!
    // Set height dynamically to fill remaining viewport below the element
    const top = el.getBoundingClientRect().top
    const vh = window.innerHeight
    const h = Math.max(520, vh - top)
    el.style.height = `${h}px`

    const w = el.offsetWidth
    const cardW = cardWPx()
    const cardH = cardHPx()
    const gap = gapPx()
    const rightMargin = rightMarginPx()
    // Reserve enough room below the queue row for the pagination controls
    // (~1/3 of the card height) plus a fixed breathing margin.
    const controlsClearance = cardH * 0.33 + 60
    const offsetTop = Math.max(0, h - (cardH + controlsClearance))
    const tabsTop = offsetTop - cardH * 0.35 - 12 // tabs sit just above the queue row, scaled with card height
    const controlsTop = offsetTop + cardH + 30    // controls sit just below the queue row
    // Height of the pagination control row itself (buttons ~25px tall) —
    // used so the details panel's CTA row lines up on the same baseline.
    const controlsRowH = 25
    const detailsBottom = Math.max(0, h - controlsTop - controlsRowH / 2 - 10)
    layoutRef.current = { w, h, offsetTop, cardW, cardH, gap, rightMargin, tabsTop, controlsTop }

    // Position desktop tabs just above the queue cards row, anchored to the
    // same right edge as the queue row itself.
    if (desktopTabsRef.current) {
      desktopTabsRef.current.style.right = `${rightMargin}px`
      desktopTabsRef.current.style.left = 'auto'
      desktopTabsRef.current.style.top = `${tabsTop}px`
    }

    // Anchor the details panels' CTA row to the same height as the
    // pagination controls (progress bar / arrows) in the queue footer.
    ;[detailsEvenRef.current, detailsOddRef.current].forEach((elx) => {
      if (elx) elx.style.bottom = `${detailsBottom}px`
    })
  }

  /**
   * X position (px, left-edge of the card) for queue slot `i` of `restCount`
   * total queue slots. Only the last `MAX_QUEUE_VISIBLE` slots are laid out
   * in the visible row (slot `restCount-1` flush against the container's
   * right edge, working backwards); anything earlier than that stays parked
   * off-screen to the right, waiting to rotate in — same as cards that
   * haven't entered yet.
   */
  function queueX(i: number, restCount: number): number {
    const { w, cardW, gap, rightMargin } = layoutRef.current
    const visibleCount = Math.min(restCount, MAX_QUEUE_VISIBLE)
    const firstVisibleIdx = restCount - visibleCount
    if (i < firstVisibleIdx) {
      // Parked off-screen, stacked beyond the row so it can stagger in later.
      const parkSlot = firstVisibleIdx - i
      return w + 400 + parkSlot * (cardW + gap)
    }
    const rowPos = i - firstVisibleIdx
    return w - rightMargin - (visibleCount - rowPos) * (cardW + gap) + gap
  }

  function animPromise(target: gsap.TweenTarget, duration: number, props: gsap.TweenVars): Promise<void> {
    return new Promise<void>(resolve => {
      gsap.to(target, { ...props, duration, onComplete: resolve })
    })
  }

  // ── step() ──────────────────────────────────────────────────────────────────
  // Returns a Promise that resolves when the CTA stagger finishes (~0.75s).
  // animatingRef is cleared in the hero-card onComplete (~0.5s).

  const stepImpl = useCallback((dir: 'next' | 'prev' = 'next') => {
    return new Promise<void>(resolve => {
      if (animatingRef.current) { resolve(); return }
      animatingRef.current = true

      const { w, h, offsetTop, cardW, cardH } = layoutRef.current
      const order = orderRef.current

      // Rotate order array
      if (dir === 'next') order.push(order.shift()!)
      else order.unshift(order.pop()!)

      const [active, ...rest] = order
      // prv = the card that was hero, now going to queue
      const prv = dir === 'next' ? rest[rest.length - 1] : rest[0]
      const prvQueueIdx = dir === 'next' ? rest.length - 1 : 0

      // Toggle which details panel is active
      const wasEven = isEvenActiveRef.current
      isEvenActiveRef.current = !wasEven

      const activePanelRef = wasEven ? detailsEvenRef : detailsOddRef
      const inactivePanelRef = wasEven ? detailsOddRef : detailsEvenRef

      // Update inactive panel content via React state.
      // Panel is opacity:0 with 0.4s delay before fading in — plenty of time to render.
      if (wasEven) setOddContent(items[active])
      else setEvenContent(items[active])

      const inactivePanel = inactivePanelRef.current!
      const activePanel = activePanelRef.current!

      // Reset inactive panel slide-up elements (they start off below their overflow containers)
      gsap.set(inactivePanel.querySelectorAll('.svc-place'), { y: 100 })
      gsap.set(inactivePanel.querySelectorAll('.svc-title'), { y: 200 })
      gsap.set(inactivePanel.querySelector('.svc-desc'), { y: 50 })
      gsap.set(inactivePanel.querySelector('.svc-cta'), { y: 60 })
      gsap.set(inactivePanelRef.current, { zIndex: 22 })
      gsap.set(activePanelRef.current, { zIndex: 12 })

      // Fade out active panel, stagger-slide-up inactive panel
      gsap.to(activePanel, { opacity: 0, ease: EASE })
      gsap.to(inactivePanel, { opacity: 1, delay: 0.4, ease: EASE })
      gsap.to(inactivePanel.querySelectorAll('.svc-place'), { y: 0, delay: 0.1, duration: 0.7, ease: EASE })
      gsap.to(inactivePanel.querySelectorAll('.svc-title'), { y: 0, delay: 0.15, duration: 0.7, ease: EASE })
      gsap.to(inactivePanel.querySelector('.svc-desc'), { y: 0, delay: 0.3, duration: 0.4, ease: EASE })
      gsap.to(inactivePanel.querySelector('.svc-cta'), {
        y: 0, delay: 0.35, duration: 0.4, ease: EASE,
        onComplete: resolve, // loop() awaits this
      })

      // Card animations
      gsap.set(cardRefs.current[prv], { zIndex: 10 })
      gsap.set(cardRefs.current[active], { zIndex: 20 })
      gsap.to(cardRefs.current[prv], { scale: 1.5, ease: EASE })
      gsap.to(cardQueueContentRefs.current[active], { opacity: 0, duration: 0.3, ease: EASE })

      // Update slide counter imperatively (no re-render)
      if (slideCounterRef.current) slideCounterRef.current.textContent = String(active + 1)

      // Progress bar
      gsap.to(progressFgRef.current, { width: PROGRESS_W * (1 / n) * (active + 1), ease: EASE })

      // Expand new hero card to fill container
      gsap.to(cardRefs.current[active], {
        x: 0, y: 0, width: w, height: h, borderRadius: 0,
        ease: EASE,
        onComplete: () => {
          // Reposition old hero to its queue slot
          const endX = queueX(prvQueueIdx, rest.length)
          const labelY = offsetTop + cardH - cardH * 0.33
          gsap.set(cardRefs.current[prv], {
            x: endX, y: offsetTop, width: cardW, height: cardH,
            zIndex: 30, borderRadius: 10, scale: 1,
          })
          gsap.set(cardQueueContentRefs.current[prv], {
            x: endX, y: labelY, opacity: 1, zIndex: 40,
          })

          // Reset now-inactive details panel for next use
          gsap.set(activePanel, { opacity: 0, zIndex: 12 })
          gsap.set(activePanel.querySelectorAll('.svc-place'), { y: 100 })
          gsap.set(activePanel.querySelectorAll('.svc-title'), { y: 200 })
          gsap.set(activePanel.querySelector('.svc-desc'), { y: 50 })
          gsap.set(activePanel.querySelector('.svc-cta'), { y: 60 })

          // Shift remaining queue cards to new positions
          rest.forEach((idx, i) => {
            if (idx !== prv) {
              const xNew = queueX(i, rest.length)
              gsap.to(cardRefs.current[idx], {
                x: xNew, y: offsetTop, width: cardW, height: cardH,
                ease: EASE, delay: 0.1 * (i + 1),
              })
              gsap.to(cardQueueContentRefs.current[idx], {
                x: xNew, y: labelY,
                opacity: 1, zIndex: 40, ease: EASE, delay: 0.1 * (i + 1),
              })
            }
          })

          animatingRef.current = false
        },
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  // ── loop() — indicator bar is the visual timer ────────────────────────────

  const CYCLE_DURATION = 10 // seconds — full left-to-right sweep per card

  async function waitWhilePaused() {
    while (isPausedRef.current && loopRunningRef.current && mountedRef.current) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }

  async function runLoop() {
    while (loopRunningRef.current && mountedRef.current) {
      if (prefersReducedMotion()) break

      gsap.set(indicatorRef.current!, { width: '0%' })
      const tween = gsap.to(indicatorRef.current!, { width: '100%', duration: CYCLE_DURATION, ease: 'none' })

      let elapsed = 0
      while (elapsed < CYCLE_DURATION * 1000 && loopRunningRef.current && mountedRef.current) {
        if (isPausedRef.current) {
          tween.pause()
          await waitWhilePaused()
          if (!loopRunningRef.current || !mountedRef.current) break
          tween.play()
        }
        await new Promise(resolve => setTimeout(resolve, 150))
        elapsed += 150
      }

      tween.kill()
      if (!loopRunningRef.current || !mountedRef.current) break
      if (!isPausedRef.current) await stepImpl('next')
      if (!loopRunningRef.current || !mountedRef.current) break
    }
  }

  function startLoop() {
    if (loopRunningRef.current) return
    loopRunningRef.current = true
    runLoop()
  }

  function stopLoop() {
    loopRunningRef.current = false
    if (indicatorRef.current) {
      gsap.killTweensOf(indicatorRef.current)
      gsap.set(indicatorRef.current, { width: '0%' })
    }
  }

  // ── Init on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true
    if (!containerRef.current) return

    computeLayout()
    const { w, h, offsetTop, cardW, cardH, rightMargin, controlsTop } = layoutRef.current
    const [active, ...rest] = orderRef.current
    const rm = prefersReducedMotion()
    const labelY = offsetTop + cardH - cardH * 0.33 // queue-card text label, ~bottom third of the thumbnail

    // Cover is visible (white overlay hides everything during setup)
    gsap.set(coverRef.current, { x: 0 })

    // Hero card: full container size
    gsap.set(cardRefs.current[active], { x: 0, y: 0, width: w, height: h, zIndex: 20, borderRadius: 0 })
    gsap.set(cardQueueContentRefs.current[active], { x: 0, y: 0, opacity: 0 })

    // Queue cards: staggered off-screen right (400px beyond the container's right edge)
    rest.forEach((i, index) => {
      gsap.set(cardRefs.current[i], {
        x: w + 400 + index * (cardW + layoutRef.current.gap),
        y: offsetTop, width: cardW, height: cardH, zIndex: 30, borderRadius: 10,
      })
      gsap.set(cardQueueContentRefs.current[i], {
        x: w + 400 + index * (cardW + layoutRef.current.gap),
        y: labelY, zIndex: 40, opacity: 1,
      })
    })

    // Details panels: hidden (active panel also starts off-screen left for the entrance slide)
    gsap.set(detailsEvenRef.current, { opacity: 0, x: -200, zIndex: 22 })
    gsap.set(detailsOddRef.current, { opacity: 0, zIndex: 12 })
    // Pre-set inactive (odd) panel text to off-below state
    if (detailsOddRef.current) {
      gsap.set(detailsOddRef.current.querySelectorAll('.svc-place'), { y: 100 })
      gsap.set(detailsOddRef.current.querySelectorAll('.svc-title'), { y: 200 })
      gsap.set(detailsOddRef.current.querySelector('.svc-desc'), { y: 50 })
      gsap.set(detailsOddRef.current.querySelector('.svc-cta'), { y: 60 })
    }

    // Progress bar initial position (1/n filled)
    gsap.set(progressFgRef.current, { width: PROGRESS_W / n })

    // Pagination: off-screen below (will slide up), anchored to the same
    // right edge as the queue row and category tabs.
    gsap.set(paginationRef.current, {
      top: controlsTop, right: rightMargin, left: 'auto',
      y: 200, opacity: 0, zIndex: 60,
    })

    // Indicator: reset to empty
    gsap.set(indicatorRef.current, { width: '0%' })

    if (rm) {
      // Reduced motion: instant layout, no animations, no auto-advance
      gsap.set(coverRef.current, { x: w + 400 })
      rest.forEach((i, index) => {
        gsap.set(cardRefs.current[i], { x: queueX(index, rest.length) })
        gsap.set(cardQueueContentRefs.current[i], { x: queueX(index, rest.length) })
      })
      gsap.set(paginationRef.current, { y: 0, opacity: 1 })
      gsap.set(detailsEvenRef.current, { opacity: 1, x: 0 })
      return
    }

    const startDelay = 0.6

    // Slide cover out to reveal
    gsap.to(coverRef.current, {
      x: w + 400, delay: 0.5, ease: EASE,
      onComplete: () => { if (mountedRef.current) startLoop() },
    })

    // Stagger queue cards into view from the right
    rest.forEach((i, index) => {
      const xFinal = queueX(index, rest.length)
      gsap.to(cardRefs.current[i], {
        x: xFinal, zIndex: 30,
        delay: startDelay + 0.05 * index, ease: EASE,
      })
      gsap.to(cardQueueContentRefs.current[i], {
        x: xFinal, zIndex: 40,
        delay: startDelay + 0.05 * index, ease: EASE,
      })
    })

    // Slide pagination up
    gsap.to(paginationRef.current, { y: 0, opacity: 1, ease: EASE, delay: startDelay })

    // Slide active details panel in from left
    gsap.to(detailsEvenRef.current, { opacity: 1, x: 0, ease: EASE, delay: startDelay })

    return () => {
      mountedRef.current = false
      stopLoop()
      const allTargets = [
        ...cardRefs.current,
        ...cardQueueContentRefs.current,
        detailsEvenRef.current,
        detailsOddRef.current,
        indicatorRef.current,
        paginationRef.current,
        progressFgRef.current,
        coverRef.current,
      ].filter(Boolean) as gsap.TweenTarget[]
      gsap.killTweensOf(allTargets)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pause / resume handlers ───────────────────────────────────────────────

  const handleMouseEnter = useCallback(() => { isPausedRef.current = true }, [])
  const handleMouseLeave = useCallback(() => {
    if (!manualPauseRef.current) isPausedRef.current = false
  }, [])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      isPausedRef.current = true
    }
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !manualPauseRef.current) {
      isPausedRef.current = false
    }
  }, [])

  const handlePrev = useCallback(() => { stepImpl('prev') }, [stepImpl])
  const handleNext = useCallback(() => { stepImpl('next') }, [stepImpl])
  const handleTogglePause = useCallback(() => {
    const next = !manualPauseRef.current
    manualPauseRef.current = next
    isPausedRef.current = next
    setIsPaused(next)
  }, [])

  // ── Early return for empty / single-item ─────────────────────────────────

  if (n === 0) return null

  // ── Details panel render helper ───────────────────────────────────────────
  // Two panels with identical structure, driven by evenContent / oddContent state.
  // GSAP controls opacity/position; React controls text content.

  function renderDetailsPanel(
    ref: React.RefObject<HTMLDivElement | null>,
    content: ServiceCategoryCarouselItem,
    ariaLive?: 'polite',
  ) {
    return (
      <div
        ref={ref}
        className="absolute pointer-events-none select-none flex flex-col-reverse"
        style={{ left: '3.1vw', maxWidth: '32.5vw', color: '#FAF6F0' }}
        aria-live={ariaLive}
      >
        {/* CTA buttons — anchored to the panel's bottom edge, level with the
            carousel's footer controls (progress bar / arrows). Everything
            else stacks upward from here (flex-col-reverse keeps this first
            in visual order while staying last in the DOM for reading order). */}
        <div
          className="svc-cta pointer-events-auto"
          style={{ display: 'flex', gap: '0.52vw', flexWrap: 'wrap' }}
        >
          {/* Primary: Request a Quote — always visible, solid gold */}
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ padding: '1.02vh 1.25vw', backgroundColor: '#E2C063', color: '#1E1A16', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}
          >
            Request a Quote
          </Link>
          {/* Secondary: View Detail — always visible */}
          <Link
            href={`/services/${categorySlug}/${content.slug}`}
            className="inline-flex items-center gap-2 text-sm transition-all hover:bg-white/10 active:scale-95"
            style={{ padding: '1.02vh 1.25vw', border: '1.5px solid rgba(255,255,255,0.55)', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}
          >
            View Detail →
          </Link>
        </div>

        {/* Description */}
        <p
          className="svc-desc"
          style={{
            color: 'rgba(255,255,255,0.82)',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1.15rem',
            lineHeight: 1.6,
            maxWidth: '26.3vw',
            marginBottom: '2.6vh',
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
        >
          {content.shortDescription}
        </p>

        {/* Icon */}
        <div style={{ height: '4.8vh', overflow: 'hidden', marginBottom: '0.6vh' }}>
          <div className="svc-title" style={{ color: '#E2C063' }}>
            <ServiceIcon name={content.iconKey} className="w-10 h-10" />
          </div>
        </div>

        {/* Service name */}
        <div style={{ overflow: 'hidden', marginBottom: '0.93vh' }}>
          <h2
            className="svc-title"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.75rem, 3.5vw, 3.5rem)',
              fontWeight: 600,
              lineHeight: 1.08,
              color: '#FFFFFF',
              margin: 0,
              textShadow: '0 2px 20px rgba(0,0,0,0.4)',
            }}
          >
            {content.name}
          </h2>
        </div>

        {/* Place label */}
        <div style={{ height: '4.3vh', overflow: 'hidden' }}>
          <div
            className="svc-place"
            style={{ paddingTop: '1.3vh', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.52vw', textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            <span style={{ display: 'inline-block', width: '1.25vw', height: '2px', borderRadius: '99px', backgroundColor: '#E2C063', flexShrink: 0 }} />
            {categoryName}
          </div>
        </div>
      </div>
    )
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden w-full"
      style={{ height: '100dvh', minHeight: '520px' }}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${categoryName} services`}
    >
      {/* ── White cover overlay — reveals on load via GSAP slide-out ─────── */}
      <div ref={coverRef} className="absolute inset-0 z-[100]" style={{ backgroundColor: '#FAF6F0' }} />

      {/* ── Golden timer indicator bar ───────────────────────────────────── */}
      <div ref={indicatorRef} className="absolute top-0 left-0 z-[60]" style={{ height: '5px', width: '0%', backgroundColor: '#E2C063' }} />

      {/* ═══ Desktop carousel (≥1024px) — GSAP controlled ════════════════ */}
      <div className="hidden lg:block absolute inset-0">
        {/* Left-side gradient — always on, makes details panel text readable */}
        <div
          className="absolute inset-0 pointer-events-none z-[16]"
          style={{ background: 'linear-gradient(105deg, rgba(12,9,6,0.82) 0%, rgba(12,9,6,0.55) 38%, transparent 62%)' }}
        />

        {/* Bottom gradient — fades toward queue card row */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-[16]"
          style={{ height: '200px', background: 'linear-gradient(to top, rgba(8,6,4,0.65) 0%, transparent 100%)' }}
        />

        {/* ── Pause-on-hover scope: category tabs, queue cards, details panels,
            pagination controls. The bare hero background (gradients above) and
            the underlying full-bleed card image are intentionally OUTSIDE this
            wrapper only where they render no foreground content — per product
            decision, hovering any card (including while it's the full-screen
            hero) still pauses, since cards are a single shared DOM node whether
            they're the hero or a queue thumbnail. ── */}
        <div
          className="absolute inset-0"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus as React.FocusEventHandler<HTMLDivElement>}
          onBlur={handleBlur as React.FocusEventHandler<HTMLDivElement>}
        >
        {/* ── Category tabs — positioned above queue cards by computeLayout() ── */}
        <nav
          ref={desktopTabsRef as React.RefObject<HTMLDivElement>}
          className="absolute z-[55] flex flex-wrap justify-end"
          style={{ top: '0px', right: '0px', gap: '5.6px' }}
          aria-label="Service categories"
        >
          {navCategories.map(({ slug, name }) => {
            const isActive = slug === categorySlug
            return (
              <Link
                key={slug}
                href={`/services/${slug}`}
                aria-current={isActive ? 'page' : undefined}
                className="uppercase tracking-widest rounded-full transition-all duration-200 backdrop-blur-sm"
                style={{
                  fontSize: '8.4px',
                  padding: '5.6px 11px',
                  ...(isActive
                    ? { backgroundColor: '#E2C063', color: '#1E1A16', fontWeight: 700 }
                    : {
                        border: '1px solid rgba(255,255,255,0.35)',
                        color: 'rgba(255,255,255,0.8)',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                      }),
                }}
              >
                {rootCategoryNames?.[slug] ?? name}
              </Link>
            )
          })}
        </nav>

        {/* All n cards — absolutely positioned; GSAP owns x/y/width/height/zIndex */}
        {items.map((item, i) => (
          <div
            key={item.slug}
            ref={el => { cardRefs.current[i] = el }}
            className="absolute overflow-hidden"
            style={{
              backgroundColor: '#1E1A16',
              backgroundImage: item.imageUrl ? `url(${cfImage(item.imageUrl, { width: 1600 })})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
            }}
            onClick={() => { if (!animatingRef.current) stepImpl('next') }}
            role="button"
            aria-label={`View ${item.name}`}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') stepImpl('next') }}
          >
            {/* Gradient overlay — bottom fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(20,16,12,0) 30%, rgba(20,16,12,0.7) 100%)' }}
            />
            {/* Icon fallback when no image */}
            {!item.imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{ color: '#E2C063' }}>
                  <ServiceIcon name={item.iconKey} className="w-24 h-24 opacity-15" />
                </div>
              </div>
            )}
            {/* Queue card text overlay — GSAP positions this; fades out when card becomes hero */}
            <div
              ref={el => { cardQueueContentRefs.current[i] = el }}
              className="absolute"
              style={{ left: 0, top: 0, paddingLeft: '14px', pointerEvents: 'none' }}
            >
              <div style={{ width: '28px', height: '5px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.8)', marginBottom: '7px' }} />
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-cormorant)', lineHeight: 1.3 }}>
                {item.name}
              </div>
            </div>
          </div>
        ))}

        {/* ── Details panel EVEN ─────────────────────────────────────────── */}
        {renderDetailsPanel(detailsEvenRef, evenContent, 'polite')}

        {/* ── Details panel ODD ─────────────────────────────────────────── */}
        {renderDetailsPanel(detailsOddRef, oddContent)}

        {/* ── Pagination: progress bar + slide counter + arrows/pause ────── */}
        <div
          ref={paginationRef}
          className="absolute flex items-center gap-3"
        >
          {/* Progress bar */}
          <div style={{ width: `${PROGRESS_W}px`, height: '3px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <div ref={progressFgRef} style={{ height: '100%', backgroundColor: '#E2C063' }} />
          </div>

          {/* Slide counter */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span ref={slideCounterRef} style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>1</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/ {n}</span>
          </div>

          <div className="flex items-center gap-1.5" style={{ marginLeft: '12px' }}>
            <button
              onClick={handlePrev}
              aria-label="Previous service"
              className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
              style={{ width: '25px', height: '25px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={handleTogglePause}
              aria-label={isPaused ? 'Resume carousel' : 'Pause carousel'}
              className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
              style={{ width: '20px', height: '20px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
            >
              {isPaused ? (
                <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
              ) : (
                <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNext}
              aria-label="Next service"
              className="flex items-center justify-center shrink-0 transition-colors hover:border-white"
              style={{ width: '25px', height: '25px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.75)' }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* ═══ Mobile fallback (<1024px) — CSS scroll-snap + arrows ═══════ */}
      {/* Always in DOM for SEO — all item text is in server-rendered HTML */}
      <div className="lg:hidden relative h-full" style={{ height: '100dvh', minHeight: '520px' }}>
        {/* Top gradient — only covers header area on mobile */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
             style={{ height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }} />

        {/* Category filters — vertical column where the antetítulo used to be */}
        <nav
          className="absolute z-30 flex flex-col items-start gap-[6px] pointer-events-auto"
          style={{ bottom: '360px', left: '20px' }}
          aria-label="Service categories"
        >
          {navCategories.map(({ slug, name }) => {
            const isActive = slug === categorySlug
            return (
              <Link
                key={slug}
                href={`/services/${slug}`}
                aria-current={isActive ? 'page' : undefined}
                className="text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full transition-all backdrop-blur-sm whitespace-nowrap"
                style={isActive
                  ? { backgroundColor: '#E2C063', color: '#1E1A16', fontWeight: 700 }
                  : { border: '1px solid rgba(255,255,255,0.38)', color: 'rgba(255,255,255,0.88)', backgroundColor: 'rgba(0,0,0,0.38)' }
                }
              >
                {rootCategoryNames?.[slug] ?? name}
              </Link>
            )
          })}
        </nav>

        {/* Scroll container */}
        <div
          ref={mobileScrollRef}
          className="flex h-full overflow-x-auto"
          style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
          onScroll={e => {
            const el = e.currentTarget
            const idx = Math.round(el.scrollLeft / el.offsetWidth)
            if (idx !== mobileIdx) setMobileIdx(idx)
          }}
        >
          {items.map((item) => (
            <div
              key={item.slug}
              className="shrink-0 relative"
              style={{
                width: '100%',
                minHeight: '520px',
                scrollSnapAlign: 'start',
                flex: '0 0 100%',
                backgroundColor: '#1E1A16',
                backgroundImage: item.imageUrl ? `url(${cfImage(item.imageUrl, { width: 1600 })})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Bottom gradient for content readability */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, rgba(10,8,5,0) 25%, rgba(10,8,5,0.95) 85%, rgba(10,8,5,1) 100%)' }}
              />
              {/* Content — leaves space at bottom for the nav bar */}
              <div className="absolute inset-x-0 bottom-20 px-6 pb-2">
                <div style={{ color: '#E2C063', marginBottom: '10px' }}>
                  <ServiceIcon name={item.iconKey} className="w-9 h-9" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.75rem, 7vw, 2.5rem)', fontWeight: 600, color: '#FFFFFF', marginBottom: '10px', lineHeight: 1.08 }}>
                  {item.name}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px', fontFamily: 'var(--font-cormorant)', maxWidth: '42ch' }}>
                  {item.shortDescription}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Primary CTA: solid gold, always visible */}
                  <Link
                    href="/#contact"
                    style={{ backgroundColor: '#E2C063', color: '#1E1A16', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 18px' }}
                  >
                    Request a Quote
                  </Link>
                  {/* Secondary CTA: always visible */}
                  <Link
                    href={`/services/${categorySlug}/${item.slug}`}
                    style={{ color: '#FFFFFF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1.5px solid rgba(255,255,255,0.5)', padding: '10px 18px' }}
                  >
                    View Detail →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation bar: category name + prev / dots / next */}
        <div
          className="absolute bottom-0 inset-x-0 z-10 flex flex-col"
          style={{ background: 'linear-gradient(to top, rgba(20,16,12,0.92) 0%, transparent 100%)' }}
        >
          {/* Category name centrado sobre los dots */}
          <div className="text-center pt-3 pb-1">
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600 }}>
              {categoryName}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <button
            aria-label="Previous service"
            onClick={() => {
              const next = Math.max(0, mobileIdx - 1)
              setMobileIdx(next)
              mobileScrollRef.current?.scrollTo({ left: next * (mobileScrollRef.current.offsetWidth), behavior: 'smooth' })
            }}
            className="flex items-center justify-center shrink-0 transition-colors hover:border-white disabled:opacity-30"
            disabled={mobileIdx === 0}
            style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.8)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Dot / pill indicators */}
          <div className="flex items-center gap-[6px]">
            {n <= 12 ? items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to service ${i + 1}`}
                onClick={() => {
                  setMobileIdx(i)
                  mobileScrollRef.current?.scrollTo({ left: i * (mobileScrollRef.current.offsetWidth), behavior: 'smooth' })
                }}
                style={{
                  width: i === mobileIdx ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === mobileIdx ? '#E2C063' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.25s ease',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              />
            )) : (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                {mobileIdx + 1} / {n}
              </span>
            )}
          </div>

          <button
            aria-label="Next service"
            onClick={() => {
              const next = Math.min(n - 1, mobileIdx + 1)
              setMobileIdx(next)
              mobileScrollRef.current?.scrollTo({ left: next * (mobileScrollRef.current.offsetWidth), behavior: 'smooth' })
            }}
            className="flex items-center justify-center shrink-0 transition-colors hover:border-white disabled:opacity-30"
            disabled={mobileIdx === n - 1}
            style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.8)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          </div>{/* end arrows row */}
        </div>{/* end nav bar */}
      </div>{/* end mobile wrapper */}
    </section>
  )
}
