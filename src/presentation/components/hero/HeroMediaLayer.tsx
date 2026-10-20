'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import type { HeroMedia } from '@/core/entities/HeroConfig'
import { cfImage } from '@/presentation/lib/cloudflareImage'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

const MOBILE_QUERY = '(max-width: 640px)'
const FALLBACK_IMAGE = '/assets/hero-test1.png'

interface Props {
  desktop?: HeroMedia
  mobile?: HeroMedia
  /** Slider: only the active slide plays and preloads its video. */
  active?: boolean
  alt?: string
  /** Force a viewport instead of following the window (admin previews). */
  viewport?: 'desktop' | 'mobile'
}

function videoMime(url: string): string | undefined {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'ogg') return 'video/ogg'
  if (ext === 'mov') return 'video/quicktime'
  return undefined
}

function posterSrc(media: HeroMedia, width: number): string | undefined {
  return media.posterUrl ? cfImage(media.posterUrl, { width }) : undefined
}

function imageSrc(media: HeroMedia | undefined, width: number): string | undefined {
  if (!media) return undefined
  if (media.type === 'image') return cfImage(media.url, { width })
  return posterSrc(media, width)
}

function ImageLayer({ desktop, mobile, alt }: { desktop?: HeroMedia; mobile?: HeroMedia; alt: string }) {
  const desktopSrc = imageSrc(desktop, 1920)
  const mobileSrc = imageSrc(mobile, 750)
  return (
    <picture>
      {mobileSrc && <source media={MOBILE_QUERY} srcSet={mobileSrc} />}
      <img
        src={desktopSrc ?? mobileSrc ?? FALLBACK_IMAGE}
        alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </picture>
  )
}

function VideoLayer({ media, active }: { media: HeroMedia; active: boolean }) {
  const settings = media.video
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const [inView, setInView] = useState(true)
  const [saveData, setSaveData] = useState(false)
  const [reduced, setReduced] = useState(false)

  const audio = settings?.audio ?? 'off'
  const start = settings?.startTime ?? 0
  const end = settings?.endTime
  const loop = settings?.loop ?? true
  const autoplay = settings?.autoplay ?? true

  useEffect(() => {
    setReduced(prefersReducedMotion())
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setSaveData(Boolean(conn?.saveData))
  }, [])

  // Pause when scrolled out of view.
  useEffect(() => {
    const el = videoRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, saveData, failed])

  const shouldPlay = active && inView && autoplay && !reduced && !saveData && !failed

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.playbackRate = settings?.playbackRate ?? 1
  }, [settings?.playbackRate, ready])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (!shouldPlay) {
      el.pause()
      return
    }
    el.muted = audio === 'on' ? false : true
    setMuted(el.muted)
    el.play().catch(() => {
      // Browser blocked autoplay with sound → retry muted so the video still plays.
      el.muted = true
      setMuted(true)
      el.play().catch(() => setFailed(true))
    })
  }, [shouldPlay, audio, ready])

  useEffect(() => {
    if (!active) return
    const el = videoRef.current
    if (el && el.readyState >= 1) el.currentTime = start
  }, [active, start])

  // Pause when the tab is hidden.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onVisibility = () => {
      if (document.hidden) el.pause()
      else if (shouldPlay) el.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [shouldPlay])

  const poster = posterSrc(media, 1920)

  if (reduced || saveData || failed) {
    return poster ? (
      <img src={poster} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : null
  }

  const mime = videoMime(media.url)
  const showToggle = audio !== 'off'

  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        loop={loop && end === undefined}
        preload={active ? 'metadata' : 'none'}
        poster={poster}
        onLoadedMetadata={(e) => {
          if (start > 0) e.currentTarget.currentTime = start
          setReady(true)
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          if (end !== undefined && el.currentTime >= end) {
            if (loop) el.currentTime = start
            else el.pause()
          }
        }}
        onEnded={(e) => {
          if (loop && end !== undefined) {
            e.currentTarget.currentTime = start
            e.currentTarget.play().catch(() => {})
          }
        }}
        onError={() => setFailed(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: settings?.objectPosition ?? 'center',
        }}
      >
        <source src={media.url} type={mime} />
      </video>
      {showToggle && ready && (
        <button
          type="button"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          onClick={() => {
            const el = videoRef.current
            if (!el) return
            el.muted = !el.muted
            setMuted(el.muted)
          }}
          style={{
            position: 'absolute', top: 88, right: 24, zIndex: 5,
            width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(250,246,240,0.4)',
            background: 'rgba(18,14,10,0.55)', color: '#FAF6F0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </>
  )
}

/** Renders one hero background slot pair (desktop + mobile), each an image or a video. */
export function HeroMediaLayer({ desktop, mobile, active = true, alt = 'Contigo construction project', viewport }: Props) {
  const [windowIsMobile, setIsMobile] = useState<boolean | null>(null)
  const isMobile = viewport ? viewport === 'mobile' : windowIsMobile

  useEffect(() => {
    if (viewport) return
    const mq = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [viewport])

  const hasVideo = desktop?.type === 'video' || mobile?.type === 'video'
  if (!hasVideo && !viewport) return <ImageLayer desktop={desktop} mobile={mobile} alt={alt} />

  // Before hydration we don't know the viewport: render the poster/image via <picture>
  // so the first paint is correct and no video is downloaded for the wrong breakpoint.
  if (isMobile === null) return <ImageLayer desktop={desktop} mobile={mobile ?? desktop} alt={alt} />

  const current = isMobile ? (mobile ?? desktop) : (desktop ?? mobile)
  if (!current) return <ImageLayer desktop={desktop} mobile={mobile} alt={alt} />

  if (current.type === 'video') {
    return <VideoLayer key={current.url} media={current} active={active} />
  }
  return <ImageLayer desktop={isMobile ? undefined : current} mobile={isMobile ? current : undefined} alt={alt} />
}
