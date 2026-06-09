'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoWithFallbackProps {
  videoSrc: string
  posterSrc: string
  alt?: string
  className?: string
}

/**
 * Renders a video with a guaranteed image fallback.
 *
 * Strategy:
 *  - The <img> is always visible and acts as the default layer.
 *  - A <video> loads in parallel (opacity-0, pointer-events-none).
 *  - When onCanPlay fires, the video fades in and the image fades out.
 *  - On onError, the video is unmounted — the image stays.
 *  - When prefers-reduced-motion is active, the video is never started.
 *
 * This is browser-autoplay-policy-proof: even if the browser blocks
 * autoplay the user always sees the poster image, never a broken state.
 */
export function VideoWithFallback({
  videoSrc,
  posterSrc,
  alt = '',
  className = '',
}: VideoWithFallbackProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Detect prefers-reduced-motion on the client
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // When reduced-motion turns on mid-session, pause the video
  useEffect(() => {
    if (!videoRef.current) return
    if (reducedMotion) {
      videoRef.current.pause()
    } else if (videoReady && !videoError) {
      videoRef.current.play().catch(() => {
        // Autoplay still blocked — keep image visible
        setVideoReady(false)
      })
    }
  }, [reducedMotion, videoReady, videoError])

  const showVideo = videoReady && !videoError && !reducedMotion

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fallback image — always present */}
      <img
        src={posterSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: showVideo ? 0 : 1,
          transition: 'opacity 600ms ease',
          zIndex: 1,
        }}
      />

      {/* Video — hidden until canplay, unmounted on error */}
      {!videoError && !reducedMotion && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onCanPlay={() => {
            setVideoReady(true)
            // Explicitly play in case autoPlay was deferred
            videoRef.current?.play().catch(() => setVideoReady(false))
          }}
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: showVideo ? 1 : 0,
            transition: 'opacity 600ms ease',
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}
