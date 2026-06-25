'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SERVICE_ROOT_SLUGS,
  SERVICE_ROOT_NAMES,
} from '@/presentation/data/serviceCategoryMeta'

/**
 * Shared tab bar for the `/services/[category]` route group. Active tab is
 * derived from the real URL segment (`usePathname()`) — these are real
 * routes, not a client-side filter, so there is no query param to read.
 */
export function ServiceCategoryTabs() {
  const pathname = usePathname()
  const activeSlug = pathname?.split('/')[2] ?? ''

  return (
    <nav
      className="flex flex-wrap gap-2 md:gap-3"
      aria-label="Service categories"
    >
      {SERVICE_ROOT_SLUGS.map((slug) => {
        const isActive = slug === activeSlug
        return (
          <Link
            key={slug}
            href={`/services/${slug}`}
            aria-current={isActive ? 'page' : undefined}
            className="text-fluid-xs uppercase tracking-widest px-4 py-2 rounded-full transition-all duration-200"
            style={
              isActive
                ? { backgroundColor: '#E2C063', color: '#1E1A16' }
                : {
                    border: '1px solid rgba(226,192,99,0.3)',
                    color: '#E2C063',
                  }
            }
          >
            {SERVICE_ROOT_NAMES[slug]}
          </Link>
        )
      })}
    </nav>
  )
}
