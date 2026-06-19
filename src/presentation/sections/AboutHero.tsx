'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function AboutHero() {
  const overlineRef = useRef<HTMLSpanElement>(null)
  const line1Ref = useRef<HTMLSpanElement>(null)
  const line2Ref = useRef<HTMLSpanElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    tl.to(overlineRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .to(line1Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to(line2Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div
      className="relative py-24 px-6 md:px-16 overflow-hidden"
      style={{
        backgroundColor: 'var(--petrol-800)',
        borderBottom: '1px solid var(--gold-a15)',
        fontFamily: 'var(--font-alegreya-sans)',
      }}
    >
      {/* Decorative monogram watermark, echoes ContactSection's corner mark */}
      <span
        aria-hidden="true"
        className="absolute -right-6 -bottom-10 select-none pointer-events-none"
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'clamp(8rem, 22vw, 16rem)',
          color: 'var(--gold-a06)',
          lineHeight: 1,
        }}
      >
        C
      </span>

      <span
        ref={overlineRef}
        className="block text-fluid-xs uppercase tracking-widest mb-6"
        style={{ color: 'var(--gold-400)', opacity: 0, transform: 'translateY(16px)' }}
      >
        Our Story
      </span>

      <h1
        className="leading-[1.05] mb-6 max-w-4xl"
        style={{ fontFamily: 'var(--font-alegreya)', fontWeight: 400 }}
      >
        <span
          ref={line1Ref}
          className="block overflow-hidden"
          style={{ opacity: 0, transform: 'translateY(28px)', color: 'var(--neutral-50)' }}
        >
          We don&apos;t build for you,
        </span>
        <span
          ref={line2Ref}
          className="block overflow-hidden italic"
          style={{ opacity: 0, transform: 'translateY(28px)', color: 'var(--gold-400)' }}
        >
          we build with you.
        </span>
      </h1>

      <p
        ref={subtitleRef}
        className="text-fluid-base max-w-xl"
        style={{ color: 'rgba(250,246,240,0.6)', opacity: 0, transform: 'translateY(16px)', lineHeight: 1.7 }}
      >
        Contigo Constructions Pty Ltd — building with trust, precision, and long-term relationships at the centre of every project.
      </p>
    </div>
  )
}
