'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLogoMorphContext } from '@/presentation/providers/LogoMorphProvider'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

interface InterpolationState {
  translate: { x: number; y: number }
  scale: number
  goldOpacity: number
  petrolOpacity: number
  leftTrackWidth: number
}

export function useScrollLogoMorph(logoRef: React.MutableRefObject<HTMLDivElement | null>) {
  const context = useLogoMorphContext()
  const cachedRectsRef = useRef<{
    from: DOMRect | null
    to: DOMRect | null
  }>({
    from: null,
    to: null,
  })
  const currentProgressRef = useRef(0)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Early return for prefers-reduced-motion
  if (prefersReducedMotion()) {
    return
  }

  useEffect(() => {
    const heroDock = context.heroDockRef.current
    const navDockDesktop = context.navDockDesktopRef.current
    const navDockMobile = context.navDockMobileRef.current
    const heroEl = document.getElementById('hero')

    if (!heroDock || !navDockDesktop || !navDockMobile || !heroEl || !logoRef.current) {
      return
    }

    // Initial measurement
    const measureRects = () => {
      const fromRect = heroDock.getBoundingClientRect()
      // Choose destination: if desktop dock is visible (width > 0), use it; otherwise use mobile
      const toRect =
        navDockDesktop.getBoundingClientRect().width > 0
          ? navDockDesktop.getBoundingClientRect()
          : navDockMobile.getBoundingClientRect()

      cachedRectsRef.current = { from: fromRect, to: toRect }
    }

    measureRects()

    // Helper: interpolate between two values
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Helper: get center point of a rect
    const getCenter = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    // Apply morph state to logo
    const applyMorph = (progress: number) => {
      currentProgressRef.current = progress

      if (!logoRef.current || !cachedRectsRef.current.from || !cachedRectsRef.current.to) {
        return
      }

      const fromCenter = getCenter(cachedRectsRef.current.from)
      const toCenter = getCenter(cachedRectsRef.current.to)
      const scaleAmount = cachedRectsRef.current.to.width / cachedRectsRef.current.from.width

      const lerpedCenterX = lerp(fromCenter.x, toCenter.x, progress)
      const lerpedCenterY = lerp(fromCenter.y, toCenter.y, progress)
      const lerpedScale = lerp(1, scaleAmount, progress)
      const goldOpacity = 1 - progress
      const petrolOpacity = progress

      // Interpolate nav dock's left column width (0 → target width)
      const leftTrackWidth = lerp(0, cachedRectsRef.current.to.width, progress)

      gsap.set(logoRef.current, {
        transform: `translate(-50%, -50%) translate(${lerpedCenterX}px, ${lerpedCenterY}px) scale(${lerpedScale})`,
        opacity: 1,
        '--gold-layer-opacity': goldOpacity,
        '--petrol-layer-opacity': petrolOpacity,
        '--nav-left-track-width': `${leftTrackWidth}px`,
      } as any)
    }

    // Create ScrollTrigger
    triggerRef.current = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: () => `+=${heroEl.offsetHeight * 0.6}`,
      scrub: true,
      onUpdate: (self) => {
        applyMorph(self.progress)
        ;(window as any).__setLogoMorphProgress(self.progress)
      },
    })

    // ResizeObserver on both docks to re-measure when they resize
    const observerCallback = () => {
      measureRects()
      applyMorph(currentProgressRef.current)
    }

    resizeObserverRef.current = new ResizeObserver(observerCallback)
    resizeObserverRef.current.observe(heroDock)
    resizeObserverRef.current.observe(navDockDesktop)
    resizeObserverRef.current.observe(navDockMobile)

    // will-change optimization
    if (logoRef.current) {
      logoRef.current.style.willChange = 'transform, opacity'
    }

    return () => {
      if (triggerRef.current) {
        triggerRef.current.kill()
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (logoRef.current) {
        logoRef.current.style.willChange = 'auto'
      }
    }
  }, [context, logoRef])
}
