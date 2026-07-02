'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import { getServiceRowDuplicationCount, buildLoopItems } from './marqueeGeometry'
import FlippableServiceCard from './FlippableServiceCard'
import type { ServiceCardData } from '../ServicesSection'

// Marquee travel speed. Deliberately brisk (the previous 40 felt sleepy) but
// still slow enough to read a card as it passes.
const PIXELS_PER_SECOND = 85
const GAP_PX = 16
const HOVER_TIME_SCALE = 0.28
// A pointer must move at least this far before it counts as a drag. Below the
// threshold we NEVER call setPointerCapture, so a genuine click always reaches
// the card's own onClick — this is what makes the 3D flip fire reliably.
const DRAG_THRESHOLD_PX = 6

interface MarqueeServiceRowProps {
  items: ServiceCardData[]
  direction: -1 | 1
}

const arrowBtn: React.CSSProperties = {
  backgroundColor: 'var(--neutral-800-60)',
  color: 'var(--contigo-primary)',
  border: '1px solid var(--gold-a30)',
}

/** Estimate a card's on-screen width (matches the `.service-card-desktop`
 *  clamp in globals.css) so the duplication count can be picked before the
 *  DOM is measured. The tween itself uses the real measured width. */
function estimateCardWidthPx(): number {
  if (typeof window === 'undefined') return 340
  const h = Math.min(Math.max(window.innerHeight * 0.2, 150), 230)
  return h * 1.8 + GAP_PX
}

export default function MarqueeServiceRow({ items, direction }: MarqueeServiceRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const suppressNextClickRef = useRef(false)

  const isPointerDownRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const trackStartXRef = useRef(0)
  const isHoveringRef = useRef(false)

  const duplicationCount = getServiceRowDuplicationCount(
    items.length,
    typeof window !== 'undefined' ? window.innerWidth : 1440,
    estimateCardWidthPx(),
  )
  const loopItems = buildLoopItems(items, duplicationCount)

  useEffect(() => {
    // gsap.context()'s callback return value is NOT invoked by GSAP itself —
    // only animations/selectors created inside are tracked for ctx.revert().
    // Capture the listener cleanup here and call it explicitly.
    let innerCleanup: (() => void) | undefined

    const ctx = gsap.context(() => {
      const track = trackRef.current
      if (!track) return

      // Guard: reduced motion or sub-desktop viewport — static row, no tween/listeners.
      if (prefersReducedMotion() || window.innerWidth < 1024) {
        gsap.set(track, { x: 0 })
        return
      }

      const oneSetWidth = track.scrollWidth / duplicationCount
      const firstCard = track.children[0] as HTMLElement | undefined
      const cardStep = firstCard ? firstCard.offsetWidth + GAP_PX : estimateCardWidthPx()

      // Both directions wrap into the SAME window [-oneSetWidth, 0]. The
      // modifier maps any raw x into this window, and the track holds enough
      // duplicated sets that this window is always fully covered — so the
      // viewport never shows an empty gap, whichever way the row travels.
      // (A [0, oneSetWidth] window for rightward rows leaves a growing empty
      // strip on the left, since the cards only extend rightward from x=0.)
      const min = -oneSetWidth
      const max = 0

      // A fresh tween with no explicit `x` start animates FROM the element's
      // current computed position, so drag-release and arrow-nudge resume
      // seamlessly. We kill + recreate (never pause/resume) to avoid the
      // tween's frozen playhead snapping back to its own expected position.
      const createTween = () =>
        gsap.to(track, {
          x: direction === -1 ? -oneSetWidth : oneSetWidth,
          duration: oneSetWidth / PIXELS_PER_SECOND,
          ease: 'none',
          repeat: -1,
          modifiers: {
            // unitize() strips the "px" GSAP writes via the CSS `translate`
            // property before wrap()'s modulo, then re-appends it. Without it
            // wrap() receives a string and returns NaN every tick.
            x: gsap.utils.unitize(gsap.utils.wrap(min, max)),
          },
        })

      let tween = createTween()
      tweenRef.current = tween

      // ── Hover slowdown (mouse only) ──────────────────────────────────
      const handlePointerEnter = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        isHoveringRef.current = true
        tween.timeScale(HOVER_TIME_SCALE)
      }
      const handlePointerLeave = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        isHoveringRef.current = false
        if (!isDraggingRef.current) tween.timeScale(1)
      }
      const row = rowRef.current
      row?.addEventListener('pointerenter', handlePointerEnter)
      row?.addEventListener('pointerleave', handlePointerLeave)

      // ── Drag override — capture only AFTER the threshold is crossed ──
      const handlePointerDown = (e: PointerEvent) => {
        isPointerDownRef.current = true
        isDraggingRef.current = false
        dragStartXRef.current = e.clientX
        trackStartXRef.current = gsap.getProperty(track, 'x') as number
      }
      const handlePointerMove = (e: PointerEvent) => {
        if (!isPointerDownRef.current) return
        if (!isDraggingRef.current) {
          if (Math.abs(e.clientX - dragStartXRef.current) < DRAG_THRESHOLD_PX) return
          // Threshold crossed → this is a drag, not a click. NOW take over.
          // Re-anchor to the live position (after kill, so getProperty reads the
          // settled x) so the track doesn't jump by however far it auto-scrolled
          // between pointerdown and the threshold being crossed.
          isDraggingRef.current = true
          tween.kill()
          trackStartXRef.current = gsap.getProperty(track, 'x') as number
          dragStartXRef.current = e.clientX
          try {
            track.setPointerCapture(e.pointerId)
          } catch {
            /* pointer may already be released */
          }
        }
        const delta = e.clientX - dragStartXRef.current
        gsap.set(track, { x: gsap.utils.wrap(min, max, trackStartXRef.current + delta) })
      }
      const handlePointerUp = (e: PointerEvent) => {
        if (!isPointerDownRef.current) return
        isPointerDownRef.current = false
        const wasDrag = isDraggingRef.current
        isDraggingRef.current = false
        if (wasDrag) {
          try {
            track.releasePointerCapture(e.pointerId)
          } catch {
            /* already released */
          }
          tween = createTween()
          tweenRef.current = tween
          tween.timeScale(isHoveringRef.current ? HOVER_TIME_SCALE : 1)
          // Swallow the synthetic click that ends a drag so it doesn't flip a card.
          suppressNextClickRef.current = true
        }
        // Pure click (no drag): tween keeps running, click reaches the card → flip.
      }
      const handleClickCapture = (e: MouseEvent) => {
        if (suppressNextClickRef.current) {
          e.stopPropagation()
          e.preventDefault()
          suppressNextClickRef.current = false
        }
      }
      track.addEventListener('pointerdown', handlePointerDown)
      track.addEventListener('pointermove', handlePointerMove)
      track.addEventListener('pointerup', handlePointerUp)
      track.addEventListener('pointercancel', handlePointerUp)
      track.addEventListener('click', handleClickCapture, { capture: true })

      // ── Arrow-nav ──────────────────────────────────────────────────────
      const nudge = (navDir: -1 | 1) => {
        tween.kill()
        const currentX = gsap.getProperty(track, 'x') as number
        const step = navDir * direction * cardStep
        const targetX = gsap.utils.wrap(min, max, currentX + step)
        gsap.to(track, {
          x: targetX,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            tween = createTween()
            tweenRef.current = tween
            tween.timeScale(isHoveringRef.current ? HOVER_TIME_SCALE : 1)
          },
        })
      }
      const prevBtn = prevBtnRef.current
      const nextBtn = nextBtnRef.current
      const handlePrevClick = () => nudge(-1)
      const handleNextClick = () => nudge(1)
      prevBtn?.addEventListener('click', handlePrevClick)
      nextBtn?.addEventListener('click', handleNextClick)

      innerCleanup = () => {
        row?.removeEventListener('pointerenter', handlePointerEnter)
        row?.removeEventListener('pointerleave', handlePointerLeave)
        track.removeEventListener('pointerdown', handlePointerDown)
        track.removeEventListener('pointermove', handlePointerMove)
        track.removeEventListener('pointerup', handlePointerUp)
        track.removeEventListener('pointercancel', handlePointerUp)
        track.removeEventListener('click', handleClickCapture, { capture: true })
        prevBtn?.removeEventListener('click', handlePrevClick)
        nextBtn?.removeEventListener('click', handleNextClick)
      }
    }, rowRef)

    return () => {
      innerCleanup?.()
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={rowRef} className="group relative flex items-center gap-3">
      <button
        ref={prevBtnRef}
        type="button"
        aria-label="Previous"
        className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 absolute left-2 z-10"
        style={arrowBtn}
      >
        ‹
      </button>

      <div className="service-marquee-viewport flex-1 overflow-hidden">
        <div ref={trackRef} className="flex gap-4">
          {loopItems.map((item) => (
            <FlippableServiceCard
              key={item.loopKey}
              slug={item.slug}
              name={item.name}
              imageUrl={item.imageUrl}
              categorySlug={item.categorySlug}
              categoryName={item.categoryName}
              className="service-card-desktop"
            />
          ))}
        </div>
      </div>

      <button
        ref={nextBtnRef}
        type="button"
        aria-label="Next"
        className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 absolute right-2 z-10"
        style={arrowBtn}
      >
        ›
      </button>
    </div>
  )
}
