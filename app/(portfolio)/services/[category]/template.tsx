'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (prefersReducedMotion()) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
    )
  }, [])

  return <div ref={ref}>{children}</div>
}
