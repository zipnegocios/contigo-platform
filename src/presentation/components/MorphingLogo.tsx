'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useScrollLogoMorph } from '@/presentation/hooks/useScrollLogoMorph'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'
import { logoPaths, LOGO_VIEWBOX } from './logo-paths'

export function MorphingLogo() {
  const logoRef = useRef<HTMLDivElement>(null)
  const shimmerTweenRef = useRef<gsap.core.Tween | null>(null)
  const sweepTweenRef = useRef<gsap.core.Tween | null>(null)

  // Drives position / scale / layer-opacity — see useScrollLogoMorph.ts
  useScrollLogoMorph(logoRef)

  // Light-sweep loop only (gold layer is now solid fill). Skipped entirely under reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return

    const sweep = document.getElementById('logoLightSweep')
    if (!sweep) return

    // Pure transform sweep (no fill/color interpolation) — GPU-friendly.
    sweepTweenRef.current = gsap.fromTo(
      sweep,
      { x: -260 },
      { x: 1280, duration: 3.6, ease: 'sine.inOut', repeat: -1, repeatDelay: 0.6 }
    )

    let frameId: number
    const syncWithMorphProgress = () => {
      const progress = (window as any).__logoMorphProgress ?? 0
      const shouldRun = progress < 0.9
      if (sweepTweenRef.current) {
        shouldRun ? sweepTweenRef.current.play() : sweepTweenRef.current.pause()
      }
      frameId = requestAnimationFrame(syncWithMorphProgress)
    }
    frameId = requestAnimationFrame(syncWithMorphProgress)

    return () => {
      cancelAnimationFrame(frameId)
      sweepTweenRef.current?.kill()
    }
  }, [])

  return (
    <div
      ref={logoRef}
      className="w-logo-hero"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 101,
        aspectRatio: '1024 / 354.041',
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox={LOGO_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <clipPath id="logoSilhouette">
            <g>{logoPaths}</g>
          </clipPath>
        </defs>

        {/* Gold layer — solid fill + clipped light-sweep on top */}
        <g style={{ opacity: 'var(--gold-layer-opacity, 1)', isolation: 'isolate' }}>
          <g fill="#E2C063">{logoPaths}</g>
          <g clipPath="url(#logoSilhouette)">
            <rect
              id="logoLightSweep"
              x="0"
              y="-40"
              width="200"
              height="434"
              fill="rgba(255,255,255,1)"
              style={{ filter: 'blur(22px)', mixBlendMode: 'screen' }}
            />
          </g>
        </g>

        {/* Petrol layer — solid sticky-state color */}
        <g style={{ opacity: 'var(--petrol-layer-opacity, 0)' }}>
          <g fill="#0D3C4C">{logoPaths}</g>
        </g>
      </svg>
    </div>
  )
}
