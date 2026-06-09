'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'

export default function HeroSection() {
  const imgWrapRef  = useRef<HTMLDivElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const overlineRef = useRef<HTMLSpanElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)

  /* ── Ken Burns — slow zoom + pan, loops forever ──────────────────────── */
  useEffect(() => {
    if (!imgWrapRef.current) return
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(imgWrapRef.current, {
      scale: 1.07,
      x: '-1.5%',
      y: '-1%',
      duration: 22,
      ease: 'sine.inOut',
    })
    return () => { tl.kill() }
  }, [])

  /* ── Text entrance ───────────────────────────────────────────────────── */
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.8 })
    tl.to(overlineRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .to(headlineRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to(ctaRef.current,      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    return () => { tl.kill() }
  }, [])

  /* ── Scroll-driven fade-out + parallax ───────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (!overlayRef.current) return
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      overlayRef.current.style.opacity    = String(1 - progress)
      overlayRef.current.style.transform  = `translateY(${-progress * 50}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* ── Background image (Ken Burns wrapper) ── */}
      <div
        ref={imgWrapRef}
        className="absolute inset-0"
        style={{ willChange: 'transform', transformOrigin: 'center center' }}
      >
        <Image
          src="/assets/hero-test1.png"
          alt="Contigo construction project — deck and pergola build"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* ── Dark scrim — heavier at bottom for text legibility ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(18,14,10,0.88) 0%, rgba(18,14,10,0.40) 45%, rgba(18,14,10,0.18) 100%)',
          zIndex: 1,
        }}
      />

      {/* ── Bottom fade into page background ── */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '15%',
          background: 'linear-gradient(to bottom, transparent, var(--atelier-ivory))',
          zIndex: 2,
        }}
      />

      {/* ── Text overlay ── */}
      <div
        ref={overlayRef}
        className="absolute bottom-0 left-0 w-full page-padding"
        style={{ zIndex: 3, paddingBottom: 'clamp(3rem, 8vh, 6rem)' }}
      >
        <span
          ref={overlineRef}
          className="label block mb-4"
          style={{ color: '#E8D5A3', opacity: 0, transform: 'translateY(20px)' }}
        >
          ADELAIDE, SOUTH AUSTRALIA
        </span>

        <h1
          ref={headlineRef}
          style={{
            color: '#FAF6F0',
            opacity: 0,
            transform: 'translateY(20px)',
            maxWidth: '800px',
          }}
        >
          Building Dreams
          <br />
          Together
        </h1>

        <p
          ref={subtitleRef}
          className="mt-6 text-base md:text-lg"
          style={{
            color: 'rgba(250,246,240,0.82)',
            maxWidth: '480px',
            opacity: 0,
            transform: 'translateY(20px)',
            lineHeight: 1.6,
          }}
        >
          We don&apos;t build for you, we build with you. Premium construction
          services tailored to your vision.
        </p>

        <div
          ref={ctaRef}
          className="flex flex-wrap gap-4 mt-8"
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          <button
            onClick={() =>
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="btn-secondary"
            style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-gold)' }}
          >
            Our Services
          </button>
          <button
            onClick={() =>
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="btn-primary"
          >
            Get a Quote
          </button>
        </div>
      </div>
    </section>
  )
}
