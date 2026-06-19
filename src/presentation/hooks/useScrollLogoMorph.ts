'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLogoMorphContext } from '@/presentation/providers/LogoMorphProvider'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function useScrollLogoMorph(logoRef: React.MutableRefObject<HTMLDivElement | null>) {
  const context = useLogoMorphContext()
  const cachedRectsRef = useRef<{ from: DOMRect | null; to: DOMRect | null }>({
    from: null,
    to: null,
  })
  const currentProgressRef = useRef(0)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // IMPORTANT: hooks must always run unconditionally — the previous
  // version had `if (prefersReducedMotion()) return` ABOVE this
  // useEffect call, which conditionally skips a hook based on a runtime
  // check. That violates the Rules of Hooks and risks a
  // "Rendered fewer hooks than expected" crash if the OS-level
  // reduced-motion setting is ever toggled while the tab is open. The
  // reduced-motion branch now lives inside the effect instead.
  useEffect(() => {
    const heroDock = context.heroDockRef.current
    const navDockDesktop = context.navDockDesktopRef.current
    const navDockMobile = context.navDockMobileRef.current
    const heroEl = document.getElementById('hero')

    if (!navDockDesktop || !navDockMobile || !logoRef.current) {
      return
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const getCenter = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })

    const measureRects = () => {
      const fromRect = heroDock
        ? heroDock.getBoundingClientRect()
        : navDockDesktop.getBoundingClientRect()
      // Choose destination: if the desktop dock is visible (width > 0),
      // target it; otherwise we're on a mobile breakpoint, target the
      // centered mobile dock instead. No JS media-query branching needed.
      const toRect =
        navDockDesktop.getBoundingClientRect().width > 0
          ? navDockDesktop.getBoundingClientRect()
          : navDockMobile.getBoundingClientRect()

      cachedRectsRef.current = { from: fromRect, to: toRect }
    }

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
      const leftTrackWidth = lerp(0, cachedRectsRef.current.to.width, progress)

      gsap.set(logoRef.current, {
        transform: `translate(-50%, -50%) translate(${lerpedCenterX}px, ${lerpedCenterY}px) scale(${lerpedScale})`,
        opacity: 1,
        '--gold-layer-opacity': 1 - progress,
        '--petrol-layer-opacity': progress,
      } as any)

      // Single source of truth for both the navbar's grid track width and
      // the shimmer/sweep pause threshold (read by Navigation.tsx and
      // MorphingLogo.tsx). Deliberately a plain global write, not React
      // state — this fires on every scrub tick and must never cause a
      // re-render. (Previously this called a non-existent
      // `window.__setLogoMorphProgress(...)`, so both consumers always
      // read `undefined ?? 0` — the nav never reserved space for the
      // logo and the shimmer never paused.)
      ;(window as any).__logoMorphProgress = progress
      document.documentElement.style.setProperty('--nav-left-track-width', `${leftTrackWidth}px`)
    }

    // ---- Reduced motion: skip the protagonist phase entirely ----
    if (prefersReducedMotion()) {
      measureRects()
      applyMorph(1) // land immediately in the small, petrol, sticky state
      return
    }

    if (!heroDock || !heroEl) {
      return
    }

    measureRects()

    triggerRef.current = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: () => `+=${heroEl.offsetHeight * 0.6}`,
      scrub: true,
      onUpdate: (self) => applyMorph(self.progress),
    })

    const observerCallback = () => {
      measureRects()
      applyMorph(currentProgressRef.current)
    }

    resizeObserverRef.current = new ResizeObserver(observerCallback)
    resizeObserverRef.current.observe(heroDock)
    resizeObserverRef.current.observe(navDockDesktop)
    resizeObserverRef.current.observe(navDockMobile)

    logoRef.current.style.willChange = 'transform, opacity'

    return () => {
      triggerRef.current?.kill()
      resizeObserverRef.current?.disconnect()
      if (logoRef.current) {
        logoRef.current.style.willChange = 'auto'
      }
    }
  }, [context, logoRef])
}
