'use client'

import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Check for touch device only on client after hydration
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  useEffect(() => {
    if (isTouch) return

    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    let mouseX = 0
    let mouseY = 0
    let ringX = 0
    let ringY = 0
    let dotX = 0
    let dotY = 0
    let needsUpdate = false
    let rafId: number

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      needsUpdate = true
    }

    const animateCursor = () => {
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      dotX += (mouseX - dotX) * 0.35
      dotY += (mouseY - dotY) * 0.35

      if (needsUpdate || Math.abs(mouseX - ringX) > 1 || Math.abs(mouseY - ringY) > 1) {
        ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`
        dot.style.transform = `translate(${dotX - 3}px, ${dotY - 3}px)`
        needsUpdate = false
      }

      rafId = requestAnimationFrame(animateCursor)
    }

    document.addEventListener('mousemove', onMouseMove)
    rafId = requestAnimationFrame(animateCursor)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [isTouch])

  if (isTouch) return null

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
