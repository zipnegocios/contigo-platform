'use client'

import Image from 'next/image'
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

export default function TeamSection() {
  const imageRef = useScrollReveal<HTMLDivElement>({ y: 32, duration: 0.9 })
  const textRef = useScrollReveal<HTMLDivElement>({
    y: 24,
    duration: 0.8,
    stagger: 0.15,
    delay: 0.1,
    childSelector: '.team-block',
  })

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--petrol-800)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-14">
        <div ref={imageRef}>
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ aspectRatio: '16 / 9', boxShadow: '0 20px 56px rgba(0,0,0,0.35)' }}
          >
            <Image
              src="https://assets.contigoconstructions.com.au/about/team.png"
              alt="The Contigo Constructions team"
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: 'var(--gold-400)' }}
            />
          </div>
        </div>

        <div ref={textRef} className="max-w-3xl mx-auto flex flex-col gap-8 text-center">
          <div className="team-block">
            <span
              className="block text-fluid-xs uppercase tracking-widest mb-5"
              style={{ color: 'var(--gold-400)' }}
            >
              Meet Our Team
            </span>
            <h2 style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--neutral-50)' }}>
              More than a team; we&apos;re people who genuinely care about bringing your vision to
              life.
            </h2>
          </div>

          <div className="team-block flex flex-col gap-5 text-left">
            <p className="text-fluid-base" style={{ color: 'rgba(250,246,240,0.78)', lineHeight: 1.7 }}>
              At Contigo Constructions, we are a family-owned business that is continually
              growing, built on a team of dedicated professionals who share one common vision: to
              deliver quality craftsmanship while providing every client with a professional,
              transparent, and personalised experience.
            </p>
            <p className="text-fluid-base" style={{ color: 'rgba(250,246,240,0.78)', lineHeight: 1.7 }}>
              Each member of our team brings different skills, experience, and expertise, but we
              all work towards the same goal: to help our clients transform their ideas into
              beautiful spaces where memories will be made for years to come.
            </p>
            <p className="text-fluid-base" style={{ color: 'rgba(250,246,240,0.78)', lineHeight: 1.7 }}>
              We enjoy new challenges because we understand that every client and every project is
              unique. Whether we&apos;re building a pergola, a deck, completing a renovation, or
              creating a home extension, we approach every job with the same level of dedication,
              care, and respect as if we were working on our own home.
            </p>
          </div>

          <div className="team-block">
            <div className="gold-rule mx-auto mb-8" />
            <p
              className="italic text-fluid-lg md:text-fluid-xl"
              style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--gold-400)', lineHeight: 1.5 }}
            >
              &ldquo;Every project we deliver is the result of a team working together with one
              shared purpose: helping you create the home you&apos;ve always imagined.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
