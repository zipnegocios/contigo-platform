'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useScrollLogoMorph } from '@/presentation/hooks/useScrollLogoMorph'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

export function MorphingLogo() {
  const logoRef = useRef<HTMLDivElement>(null)
  const shimmerTweenRef = useRef<gsap.core.Tween | null>(null)

  // Use the morph hook to set up position/scale interpolation
  useScrollLogoMorph(logoRef)

  // Set up shimmer animation for gold layer
  useEffect(() => {
    const gradient = document.getElementById('shimmerGradient')
    if (!gradient || prefersReducedMotion()) return

    const shimmerTween = gsap.to(gradient, {
      attr: { gradientTransform: 'translate(200%)' },
      duration: 3,
      ease: 'none',
      repeat: -1,
      paused: false,
    })

    shimmerTweenRef.current = shimmerTween

    return () => {
      shimmerTween.kill()
    }
  }, [])

  // Pause shimmer when progress is high (invisible layer)
  useEffect(() => {
    const checkProgress = () => {
      const progress = (window as any).__logoMorphProgress ?? 0
      if (shimmerTweenRef.current) {
        if (progress >= 0.9) {
          shimmerTweenRef.current.pause()
        } else {
          shimmerTweenRef.current.play()
        }
      }
      requestAnimationFrame(checkProgress)
    }

    const frameId = requestAnimationFrame(checkProgress)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // SVG logo paths (identical for both layers)
  const logoPaths = (
    <>
      <path d="M310.034,121.93c14.81-30.873,44.554-59.459,81.995-59.459c41.175,0,62.448,20.843,73.787,49.377h3.724 V68.793c0,0-45.296-22.015-100.696-15.377c-45.617,5.466-83.573,22.96-107.265,71.313c-12.713,25.942-13.287,28.947-13.494,70.571 c-0.187,38.029-11.654,91.005-72.238,91.005c-43.642,0-87.596-56.903-88.951-102.993c-1.759-59.82,28.78-101.149,62.241-114.21 c39.899-15.571,90.516,2.083,103.78,43.347h3.553v-43.57c0,0-52.586-26.28-119.056-12.559 C85.646,67.005,34.861,109.282,37.069,183.003c2.156,71.854,54.81,120.142,138.777,118.843 c77.172-1.191,107.658-52.625,117.432-88.419C303.902,174.526,296.622,149.893,310.034,121.93" />
      <path d="M383.906,286.213c-60.365-8.166-79.141-72.891-79.141-72.891l0.066-0.407c0,0-0.066,0.407-0.217,1.161 c-1.063,5.397-6.312,28.471-21.234,46.122c0,0,34.269,41.674,95.955,41.674c63.209,0,89.558-19.613,89.558-19.613l5.892-40.384 C474.786,241.875,441.593,294.018,383.906,286.213" />
    </>
  )

  return (
    <div
      ref={logoRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99,
        width: 'clamp(14rem, 28vw, 22rem)',
        aspectRatio: '1024 / 354.041',
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 1024 354.041"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#E2C063', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#F5E6C8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#E2C063', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Gold layer with shimmer */}
        <g
          style={{
            opacity: 'var(--gold-layer-opacity, 1)',
            transition: 'opacity 0.3s ease',
          }}
        >
          <g>{logoPaths}</g>
        </g>

        {/* Petrol solid layer */}
        <g
          style={{
            opacity: 'var(--petrol-layer-opacity, 0)',
            transition: 'opacity 0.3s ease',
          }}
        >
          <g style={{ fill: '#0D3C4C' }}>{logoPaths}</g>
        </g>
      </svg>
    </div>
  )
}
