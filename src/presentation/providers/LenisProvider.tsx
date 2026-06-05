'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup GSAP + ScrollTrigger without Lenis
    // This allows native smooth scrolling or CSS scroll-behavior

    // Update ScrollTrigger on every scroll frame
    window.addEventListener('scroll', ScrollTrigger.update, { passive: true })

    // Sync GSAP ticker with scroll
    gsap.ticker.add(() => {
      ScrollTrigger.update()
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      window.removeEventListener('scroll', ScrollTrigger.update)
      gsap.ticker.lagSmoothing(1)
    }
  }, [])

  return <>{children}</>
}
