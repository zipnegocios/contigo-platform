'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

export default function AboutClosingCTA() {
  const contentRef = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8, start: 'top 80%' })

  return (
    <div
      className="relative py-24 px-6 md:px-16 text-center overflow-hidden"
      style={{ backgroundColor: '#547682', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div ref={contentRef} className="max-w-2xl mx-auto">
        <h2
          className="mb-6"
          style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--neutral-50)' }}
        >
          Let&apos;s build it together.
        </h2>
        <p
          className="text-fluid-base mb-10"
          style={{ color: '#FAF6F0', lineHeight: 1.7 }}
        >
          Whatever stage your project is at, our team is ready to bring trust, precision, and
          craftsmanship to it.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/#contact" className="btn-primary">
            Request a Quote
          </Link>
          <Link
            href="/projects"
            className="btn-secondary"
            style={{ borderColor: 'var(--neutral-50)', color: 'var(--neutral-50)' }}
          >
            View Our Projects
          </Link>
        </div>
      </div>
    </div>
  )
}
