'use client'

import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'
import {
  BRAND_LOCKUP_VIEWBOX,
  brandLetterGlyphs,
  brandSeparatorRects,
} from '@/presentation/components/brand-lockup-paths'

export default function MissionVisionSection() {
  const imageRef = useScrollReveal<HTMLDivElement>({ y: 32, duration: 0.9 })
  const textRef = useScrollReveal<HTMLDivElement>({
    y: 24,
    duration: 0.8,
    stagger: 0.18,
    delay: 0.1,
    childSelector: '.mv-block',
  })

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-50)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div ref={imageRef} className="lg:col-span-5">
          <div
            className="relative overflow-hidden rounded-2xl flex items-center justify-center"
            style={{
              aspectRatio: '4 / 5',
              backgroundColor: 'var(--petrol-800)',
              boxShadow: '0 16px 48px rgba(45,41,36,0.18)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 45%, rgba(226,192,99,0.22) 0%, rgba(226,192,99,0.06) 45%, transparent 70%)',
              }}
            />
            <svg
              viewBox={BRAND_LOCKUP_VIEWBOX}
              aria-label="Contigo Constructions Pty"
              className="relative"
              style={{ width: 'clamp(9rem, 22vw, 14rem)', height: 'auto' }}
            >
              {brandLetterGlyphs.map((glyph, i) =>
                glyph.type === 'path' ? (
                  <path key={i} fill="var(--gold-400)" d={glyph.d} />
                ) : (
                  <polygon key={i} fill="var(--gold-400)" points={glyph.points} />
                )
              )}
              {brandSeparatorRects.map((r, i) => (
                <rect key={i} fill="var(--gold-400)" x={r.x} y={r.y} width={r.width} height={r.height} />
              ))}
            </svg>
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: 'var(--gold-400)' }}
            />
          </div>
        </div>

        <div ref={textRef} className="lg:col-span-7 flex flex-col gap-10">
          <div className="mv-block">
            <h2 style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--contigo-foreground)' }}>
              Mission
            </h2>
            <p
              className="text-fluid-lg mt-4 max-w-2xl"
              style={{ color: 'var(--contigo-foreground)', opacity: 0.82, lineHeight: 1.7 }}
            >
              To design and deliver high-quality construction solutions that align with our
              clients&apos; needs, through efficient processes, strong technical standards, and a
              firm commitment to excellence.
            </p>
          </div>

          <div className="mv-block">
            <h2 style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--contigo-foreground)' }}>
              Vision
            </h2>
            <p
              className="text-fluid-lg mt-4 max-w-2xl"
              style={{ color: 'var(--contigo-foreground)', opacity: 0.82, lineHeight: 1.7 }}
            >
              To establish ourselves as a leading construction company in Australia, recognised
              for the quality of our projects, reliability in execution, and sustainable growth.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
