'use client'

import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

export default function ValuePropositionBand() {
  const quoteRef = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.9, start: 'top 75%' })

  return (
    <section
      className="section-gap page-padding relative"
      style={{ backgroundColor: 'var(--petrol-800)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div ref={quoteRef} className="max-w-4xl mx-auto text-center">
        <div className="gold-rule mx-auto mb-10" />
        <p
          className="italic text-fluid-2xl md:text-fluid-3xl"
          style={{
            fontFamily: 'var(--font-alegreya)',
            color: 'var(--neutral-50)',
            lineHeight: 1.45,
          }}
        >
          We provide a comprehensive approach to every project, supporting our clients from
          planning through to final delivery — differentiated by{' '}
          <span style={{ color: 'var(--gold-400)', fontStyle: 'normal' }}>
            adaptability, clear communication, on-time delivery, and high-quality standards
          </span>
          , ensuring outcomes that exceed expectations.
        </p>
        <div className="gold-rule mx-auto mt-10" />
      </div>
    </section>
  )
}
