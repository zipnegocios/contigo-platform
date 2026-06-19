'use client'

import { useRouter, usePathname } from 'next/navigation'

interface FilterCategory {
  name: string
  slug: string
}

interface CategoryFilterPillsProps {
  categories: FilterCategory[]
  activeSlug: string | null
  basePath: string
}

export function CategoryFilterPills({ categories, activeSlug, basePath }: CategoryFilterPillsProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = (slug: string | null) => {
    const url = slug ? `${basePath}?category=${slug}` : basePath
    router.push(url)
  }

  if (categories.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => navigate(null)}
        className="px-[clamp(0.875rem,1.8vw,1.25rem)] py-[clamp(0.375rem,0.8vw,0.5rem)] min-h-[44px] rounded-full text-fluid-sm font-medium transition-all duration-200 flex items-center"
        style={
          !activeSlug
            ? { backgroundColor: '#E2C063', color: '#1E1A16' }
            : { backgroundColor: 'transparent', color: '#6B6560', border: '1px solid rgba(226,192,99,0.3)' }
        }
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          onClick={() => navigate(cat.slug)}
          className="px-[clamp(0.875rem,1.8vw,1.25rem)] py-[clamp(0.375rem,0.8vw,0.5rem)] min-h-[44px] rounded-full text-fluid-sm font-medium transition-all duration-200 flex items-center"
          style={
            activeSlug === cat.slug
              ? { backgroundColor: '#E2C063', color: '#1E1A16' }
              : { backgroundColor: 'transparent', color: '#6B6560', border: '1px solid rgba(226,192,99,0.3)' }
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
