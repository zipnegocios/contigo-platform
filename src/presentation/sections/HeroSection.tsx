'use client'
import { useEffect, useRef, useState } from 'react'
import type { HeroConfig, HeroButton } from '@/core/entities/HeroConfig'
import { DynamicFormModal } from '@/presentation/components/DynamicFormModal'

const FALLBACK_CONFIG: HeroConfig = {
  id: 'fallback',
  mode: 'single',
  headline: 'Building Dreams Together',
  subtitle: "We don't build for you, we build with you. Premium construction services tailored to your vision.",
  eyebrow: 'Adelaide, South Australia',
  desktopImageUrl: '/assets/hero-test1.png',
  mobileImageUrl: undefined,
  buttons: [
    { id: 'btn-1', label: 'Our Services', style: 'secondary', linkType: 'scroll', href: '#services', scrollTarget: 'services' },
    { id: 'btn-2', label: 'Get a Quote', style: 'primary', linkType: 'scroll', href: '#contact', scrollTarget: 'contact' },
  ],
  slides: [],
  autoplayInterval: 5000,
  overlayOpacity: 50,
  updatedAt: new Date(0),
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function CTAButtons({ buttons, onOpenForm }: { buttons: HeroButton[]; onOpenForm: (slug: string, name?: string) => void }) {
  return (
    <div className="flex flex-wrap gap-4 mt-8" style={{ opacity: 0, transform: 'translateY(20px)' }} data-hero-cta>
      {buttons.map((btn) => {
        const handleClick =
          btn.linkType === 'scroll'
            ? () => scrollTo(btn.scrollTarget ?? btn.href.replace('#', ''))
            : btn.linkType === 'form'
              ? () => onOpenForm(btn.formSlug ?? '', btn.formName)
              : () => { window.location.href = btn.href }
        if (btn.style === 'primary') {
          return (
            <button key={btn.id} onClick={handleClick} className="btn-primary">
              {btn.label}
            </button>
          )
        }
        return (
          <button
            key={btn.id}
            onClick={handleClick}
            className="btn-secondary"
            style={{ borderColor: 'var(--contigo-primary)', color: 'var(--contigo-primary)' }}
          >
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  config?: HeroConfig | null
}

export default function HeroSection({ config }: Props) {
  const cfg = config ?? FALLBACK_CONFIG
  const [activeIdx, setActiveIdx] = useState(0)
  const [formModal, setFormModal] = useState<{ slug: string; name?: string } | null>(null)

  const imgWrapRef  = useRef<HTMLDivElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const overlineRef = useRef<HTMLSpanElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)

  /* ── Ken Burns — slow zoom + pan, loops forever ──────────────────────── */
  useEffect(() => {
    if (!imgWrapRef.current) return
    // Dynamic import to avoid SSR issues
    import('gsap').then(({ gsap }) => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true })
      tl.to(imgWrapRef.current, {
        scale: 1.07,
        x: '-1.5%',
        y: '-1%',
        duration: 22,
        ease: 'sine.inOut',
      })
      const onVisibilityChange = () => {
        if (document.hidden) tl.pause()
        else tl.resume()
      }
      document.addEventListener('visibilitychange', onVisibilityChange)
      return () => {
        tl.kill()
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    })
  }, [activeIdx])

  /* ── Text entrance ───────────────────────────────────────────────────── */
  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      const tl = gsap.timeline({ delay: 0.8 })
      tl.to(overlineRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .to(ctaRef.current,      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      return () => { tl.kill() }
    })
  }, [])

  /* ── Scroll-driven fade-out + parallax ───────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (!overlayRef.current) return
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      overlayRef.current.style.opacity   = String(1 - progress)
      overlayRef.current.style.transform = `translateY(${-progress * 50}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Slider auto-advance ─────────────────────────────────────────────── */
  useEffect(() => {
    if (cfg.mode !== 'slider' || cfg.slides.length <= 1) return
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % cfg.slides.length),
      cfg.autoplayInterval,
    )
    return () => clearInterval(id)
  }, [cfg.mode, cfg.slides.length, cfg.autoplayInterval])

  const activeSlide = cfg.mode === 'slider' && cfg.slides.length > 0 ? cfg.slides[activeIdx] : null
  const displayEyebrow  = activeSlide?.eyebrow  ?? cfg.eyebrow
  const displayHeadline = activeSlide?.headline ?? cfg.headline
  const displaySubtitle = activeSlide?.subtitle ?? cfg.subtitle
  const displayButtons  = activeSlide?.buttons.length ? activeSlide.buttons : cfg.buttons
  const overlayOpacity  = cfg.overlayOpacity / 100

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* ── Background images ── */}
      {cfg.mode === 'single' ? (
        <div
          key="single"
          ref={imgWrapRef}
          className="absolute inset-0"
          style={{ willChange: 'transform', transformOrigin: 'center center' }}
        >
          <picture>
            {cfg.mobileImageUrl && (
              <source media="(max-width: 640px)" srcSet={cfg.mobileImageUrl} />
            )}
            <img
              src={cfg.desktopImageUrl ?? '/assets/hero-test1.png'}
              alt="Contigo construction project"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </picture>
        </div>
      ) : (
        cfg.slides.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0"
            ref={i === activeIdx ? imgWrapRef : undefined}
            style={{
              willChange: 'transform, opacity',
              transformOrigin: 'center center',
              opacity: i === activeIdx ? 1 : 0,
              transition: 'opacity 800ms ease',
              pointerEvents: i === activeIdx ? 'auto' : 'none',
            }}
          >
            <picture>
              {slide.mobileImageUrl && (
                <source media="(max-width: 640px)" srcSet={slide.mobileImageUrl} />
              )}
              <img
                src={slide.desktopImageUrl || '/assets/hero-test1.png'}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </picture>
          </div>
        ))
      )}

      {/* ── Dark scrim ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to top, rgba(18,14,10,${Math.min(overlayOpacity + 0.38, 0.95)}) 0%, rgba(18,14,10,${overlayOpacity * 0.8}) 45%, rgba(18,14,10,${overlayOpacity * 0.36}) 100%)`,
          zIndex: 1,
        }}
      />

      {/* ── Bottom fade into page background ── */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '15%',
          background: 'linear-gradient(to bottom, transparent, var(--neutral-50))',
          zIndex: 2,
        }}
      />

      {/* ── Text overlay ── */}
      <div
        ref={overlayRef}
        className="absolute bottom-0 left-0 w-full page-padding"
        style={{ zIndex: 3, paddingBottom: 'clamp(3rem, 8vh, 6rem)' }}
      >
        <div
          className="w-logo-hero"
          style={{
            aspectRatio: '1024 / 354.041',
            marginBottom: 'clamp(2rem, 5vh, 3.5rem)',
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        />

        {displayEyebrow && (
          <span
            ref={overlineRef}
            className="label block mb-4"
            style={{ color: '#E8D5A3', opacity: 0, transform: 'translateY(20px)', textTransform: 'uppercase' }}
          >
            {displayEyebrow}
          </span>
        )}

        <h1
          ref={headlineRef}
          style={{
            color: '#FAF6F0',
            opacity: 0,
            transform: 'translateY(20px)',
            maxWidth: '800px',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            lineHeight: 1.05,
            whiteSpace: 'pre-line',
          }}
        >
          {displayHeadline}
        </h1>

        {displaySubtitle && (
          <p
            ref={subtitleRef}
            className="mt-6 text-fluid-base"
            style={{
              color: 'rgba(250,246,240,0.82)',
              maxWidth: '480px',
              opacity: 0,
              transform: 'translateY(20px)',
              lineHeight: 1.6,
            }}
          >
            {displaySubtitle}
          </p>
        )}

        <div ref={ctaRef} style={{ opacity: 0, transform: 'translateY(20px)' }}>
          <CTAButtons
            buttons={displayButtons}
            onOpenForm={(slug, name) => setFormModal({ slug, name })}
          />
        </div>
      </div>

      {/* Slider dots */}
      {cfg.mode === 'slider' && cfg.slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: 6 }}>
          {cfg.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                width: i === activeIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIdx ? '#E2C063' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      <DynamicFormModal
        slug={formModal?.slug ?? null}
        formName={formModal?.name}
        open={formModal !== null}
        onClose={() => setFormModal(null)}
      />
    </section>
  )
}
