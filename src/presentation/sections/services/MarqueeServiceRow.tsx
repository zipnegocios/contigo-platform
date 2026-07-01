'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import { getServiceRowDuplicationCount, buildLoopItems } from './marqueeGeometry'
import FlippableServiceCard from './FlippableServiceCard'

const PIXELS_PER_SECOND = 40
const CARD_WIDTH_PX = 336

interface MarqueeServiceRowProps {
  categorySlug: string
  categoryName: string
  items: { slug: string; name: string; imageUrl: string }[]
  direction: -1 | 1
}

const arrowBtn: React.CSSProperties = {
  backgroundColor: 'var(--neutral-800-60)',
  color: 'var(--contigo-primary)',
  border: '1px solid var(--gold-a30)',
}

export default function MarqueeServiceRow({
  categorySlug,
  categoryName,
  items,
  direction,
}: MarqueeServiceRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const suppressNextClickRef = useRef(false)

  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const trackStartXRef = useRef(0)
  const totalMovementRef = useRef(0)
  const pointerDownTimeRef = useRef(0)
  const isHoveringRef = useRef(false)

  const duplicationCount = getServiceRowDuplicationCount(
    items.length,
    typeof window !== 'undefined' ? window.innerWidth : 1440,
    CARD_WIDTH_PX,
  )
  const loopItems = buildLoopItems(items, duplicationCount)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current
      if (!track) return

      // Guard: reduced motion or sub-desktop viewport — static row, no tween/listeners.
      if (prefersReducedMotion() || window.innerWidth < 1024) {
        gsap.set(track, { x: 0 })
        return
      }

      const oneSetWidth = track.scrollWidth / duplicationCount

      const min = direction === -1 ? -oneSetWidth : 0
      const max = direction === -1 ? 0 : oneSetWidth

      const tween = gsap.to(track, {
        x: direction === -1 ? -oneSetWidth : oneSetWidth,
        duration: oneSetWidth / PIXELS_PER_SECOND,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.wrap(min, max),
        },
      })
      tweenRef.current = tween

      // ── Hover slowdown (mouse only) ──────────────────────────────────
      const handlePointerEnter = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        isHoveringRef.current = true
        tween.timeScale(0.28)
      }
      const handlePointerLeave = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        isHoveringRef.current = false
        if (!isDraggingRef.current) {
          tween.timeScale(1)
        }
      }

      const row = rowRef.current
      row?.addEventListener('pointerenter', handlePointerEnter)
      row?.addEventListener('pointerleave', handlePointerLeave)

      // ── Drag override (Pointer Events on the track) ──────────────────
      const handlePointerDown = (e: PointerEvent) => {
        isDraggingRef.current = true
        dragStartXRef.current = e.clientX
        trackStartXRef.current = gsap.getProperty(track, 'x') as number
        totalMovementRef.current = 0
        pointerDownTimeRef.current = Date.now()
        tween.pause()
        track.setPointerCapture(e.pointerId)
      }

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current) return
        const delta = e.clientX - dragStartXRef.current
        totalMovementRef.current = Math.max(totalMovementRef.current, Math.abs(delta))
        gsap.set(track, {
          x: gsap.utils.wrap(min, max, trackStartXRef.current + delta),
        })
      }

      const handlePointerUp = () => {
        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        const wasClick =
          totalMovementRef.current < 7 && Date.now() - pointerDownTimeRef.current < 300
        tween.resume()
        if (!wasClick) {
          suppressNextClickRef.current = true
        }
        tween.timeScale(isHoveringRef.current ? 0.28 : 1)
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
      // "next" continues one card-width further in the row's own autoplay
      // direction; "prev" steps one card-width the opposite way.
      const nudge = (navDir: -1 | 1) => {
        tween.pause()
        const currentX = gsap.getProperty(track, 'x') as number
        const step = navDir * direction * CARD_WIDTH_PX
        const targetX = gsap.utils.wrap(min, max, currentX + step)
        gsap.to(track, {
          x: targetX,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => tween.resume(),
        })
      }

      const prevBtn = prevBtnRef.current
      const nextBtn = nextBtnRef.current
      const handlePrevClick = () => nudge(-1)
      const handleNextClick = () => nudge(1)
      prevBtn?.addEventListener('click', handlePrevClick)
      nextBtn?.addEventListener('click', handleNextClick)

      return () => {
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

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={rowRef} className="group relative flex items-center gap-3">
      <button
        ref={prevBtnRef}
        type="button"
        aria-label="Previous"
        className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 absolute left-0 z-10"
        style={arrowBtn}
      >
        ‹
      </button>

      <div className="flex-1 overflow-hidden">
        <div ref={trackRef} className="marquee-row-track flex gap-4">
          {loopItems.map((item) => (
            <FlippableServiceCard
              key={item.loopKey}
              slug={item.slug}
              name={item.name}
              imageUrl={item.imageUrl}
              categorySlug={categorySlug}
              categoryName={categoryName}
              style={{ width: 320, height: 400, flexShrink: 0 }}
            />
          ))}
        </div>
      </div>

      <button
        ref={nextBtnRef}
        type="button"
        aria-label="Next"
        className="w-[clamp(2.75rem,4vw,3rem)] h-[clamp(2.75rem,4vw,3rem)] rounded-full flex-shrink-0 flex items-center justify-center text-fluid-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 absolute right-0 z-10"
        style={arrowBtn}
      >
        ›
      </button>
    </div>
  )
}
