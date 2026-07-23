'use client'

import { useRef, useState } from 'react'

interface MagnifierLightboxImageProps {
  src: string
  alt: string
  magnifierEnabled: boolean
  zoom: number
  className?: string
  style?: React.CSSProperties
}

const LENS_SIZE = 200

export function MagnifierLightboxImage({
  src,
  alt,
  magnifierEnabled,
  zoom,
  className,
  style,
}: MagnifierLightboxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lensPos, setLensPos] = useState<{ x: number; y: number; bgX: number; bgY: number } | null>(null)

  const updateLensFromPoint = (clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setLensPos(null)
      return
    }

    const bgX = (x / rect.width) * 100
    const bgY = (y / rect.height) * 100

    setLensPos({ x, y, bgX, bgY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnifierEnabled) return
    updateLensFromPoint(e.clientX, e.clientY)
  }

  const handleMouseLeave = () => setLensPos(null)

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!magnifierEnabled) return
    const touch = e.touches[0]
    if (!touch) return
    updateLensFromPoint(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => setLensPos(null)

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={magnifierEnabled ? handleTouchMove : undefined}
      onTouchEnd={magnifierEnabled ? handleTouchEnd : undefined}
      style={{ touchAction: magnifierEnabled ? 'none' : undefined }}
    >
      <img src={src} alt={alt} className={className} style={style} draggable={false} />

      {magnifierEnabled && lensPos && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: lensPos.x - LENS_SIZE / 2,
            top: lensPos.y - LENS_SIZE / 2,
            width: LENS_SIZE,
            height: LENS_SIZE,
            border: '2px solid #E2C063',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
            backgroundPosition: `${lensPos.bgX}% ${lensPos.bgY}%`,
          }}
        />
      )}
    </div>
  )
}
