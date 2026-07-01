import Link from 'next/link'
import type { CtaBlockData } from '@/types/pageBlocks'

interface CtaBlockProps { data: CtaBlockData }

export function CtaBlock({ data }: CtaBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div
        className="rounded-2xl px-8 py-10 text-center"
        style={{ backgroundColor: '#2D2924' }}
      >
        {data.title && (
          <h2 className="text-fluid-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}>
            {data.title}
          </h2>
        )}
        {data.subtitle && (
          <p className="text-fluid-sm mb-6" style={{ color: 'rgba(250,246,240,0.7)' }}>{data.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href={data.primaryBtn.href}
            className="px-6 py-3 rounded-lg font-semibold text-fluid-sm transition-all min-h-[44px] inline-flex items-center"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            {data.primaryBtn.label}
          </Link>
          {data.secondaryBtn && (
            <Link
              href={data.secondaryBtn.href}
              className="px-6 py-3 rounded-lg font-semibold text-fluid-sm transition-all min-h-[44px] inline-flex items-center"
              style={{ border: '1.5px solid rgba(250,246,240,0.3)', color: '#FAF6F0' }}
            >
              {data.secondaryBtn.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
