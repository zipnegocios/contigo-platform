'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ServiceIcon } from '@/presentation/components/ServiceIcons'
import { prefersReducedMotion } from '@/presentation/animations/prefersReducedMotion'

export interface ServiceCategoryGridItem {
  slug: string
  name: string
  shortDescription: string
  iconKey: string
  imageUrl: string | null
  published: boolean
}

interface Props {
  categorySlug: string
  items: ServiceCategoryGridItem[]
}

/**
 * Grid of service cards for one root category. `key={categorySlug}` is
 * applied by the parent (`page.tsx`) so this component remounts cleanly on
 * every real navigation between `/services/carpentry` and
 * `/services/cladding`, re-triggering the stagger reveal each time.
 */
export function ServiceCategoryGrid({ categorySlug, items }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('.svc-card')
      if (cards && cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.07,
            clearProps: 'opacity,transform',
          },
        )
      }
    }, gridRef)

    return () => ctx.revert()
  }, [categorySlug])

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {items.map((item) => {
        const card = (
          <div
            className="svc-card group relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: '#1E1A16',
              border: '1px solid rgba(226,192,99,0.18)',
            }}
          >
            {item.imageUrl && (
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(30,26,22,0) 0%, rgba(30,26,22,0.85) 100%)',
                  }}
                />
              </div>
            )}

            <div className="flex flex-col flex-1 p-6">
              <span className="inline-block mb-4" style={{ color: '#E2C063' }}>
                <ServiceIcon name={item.iconKey} className="w-8 h-8" />
              </span>

              <h3
                className="text-fluid-lg font-semibold leading-tight mb-2"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
              >
                {item.name}
              </h3>

              <p
                className="text-fluid-sm leading-relaxed flex-1"
                style={{ color: '#A89E8C' }}
              >
                {item.shortDescription}
              </p>

              {item.published && (
                <span
                  className="mt-5 inline-flex items-center gap-2 text-fluid-xs uppercase tracking-widest"
                  style={{ color: '#E2C063' }}
                >
                  View full details
                  <span aria-hidden="true">&rarr;</span>
                </span>
              )}
            </div>
          </div>
        )

        if (!item.published) {
          return <div key={item.slug}>{card}</div>
        }

        return (
          <Link
            key={item.slug}
            href={`/services/${categorySlug}/${item.slug}`}
            className="block h-full"
          >
            {card}
          </Link>
        )
      })}
    </div>
  )
}
