'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup GSAP + ScrollTrigger without Lenis
    // This allows native smooth scrolling or CSS scroll-behavior

    // Sync GSAP ticker with scroll (scroll event updates are redundant)
    gsap.ticker.add(() => {
      ScrollTrigger.update()
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.lagSmoothing(1)
    }
  }, [])

  return <>{children}</>
}
