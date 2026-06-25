'use client'

import { useMemo, useState } from 'react'
import type { CategoryType, FlatCategory } from '@/types/category'
import { CategoryTreeView } from './CategoryTreeView'

interface CategoryManagerClientProps {
  serviceFlat: FlatCategory[]
  projectFlat: FlatCategory[]
}

type CategoryFilter = 'all' | CategoryType

const FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'service', label: 'Services' },
  { value: 'project', label: 'Projects' },
]

export function CategoryManagerClient({ serviceFlat, projectFlat }: CategoryManagerClientProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const groups = useMemo(() => {
    const all = [
      { type: 'service' as const, flat: serviceFlat },
      { type: 'project' as const, flat: projectFlat },
    ]
    if (filter === 'all') return all
    return all.filter((g) => g.type === filter)
  }, [filter, serviceFlat, projectFlat])

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #E5DDD0' }}>
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className="px-5 py-2.5 text-fluid-sm font-medium transition-all min-h-[44px]"
            style={
              filter === value
                ? { color: 'var(--contigo-primary)', borderBottom: '2px solid var(--contigo-primary)' }
                : { color: '#6B6560' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <CategoryTreeView groups={groups} />
    </div>
  )
}
