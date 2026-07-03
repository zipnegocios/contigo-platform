'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import type { FlatCategory } from '@/types/category'
import { CategoryFormModal } from './CategoryFormModal'

interface CategoryManagerClientProps {
  categories: FlatCategory[]
}

export function CategoryManagerClient({ categories }: CategoryManagerClientProps) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<FlatCategory | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg text-fluid-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-150 min-h-[44px]"
          style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
        >
          <Plus className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          Add category
        </button>
      </div>

      {/* Category list — simple flat grid of the 4 shared categories */}
      <div
        className="rounded-lg overflow-hidden bg-white"
        style={{ border: '1px solid #E5DDD0', boxShadow: '0 2px 8px rgba(45,41,36,0.06)' }}
      >
        {categories.length === 0 ? (
          <div className="py-16 text-center text-fluid-sm" style={{ color: '#6B6560' }}>
            No categories found. Run the migration script first.
          </div>
        ) : (
          <ul>
            {categories.map((cat, idx) => (
              <li
                key={cat.id}
                className="flex items-center justify-between px-6 py-4 gap-4"
                style={{
                  borderBottom: idx < categories.length - 1 ? '1px solid #F0E8DC' : 'none',
                }}
              >
                {/* Left: name + slug + status */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(226,192,99,0.12)' }}>
                    <span className="text-fluid-xs font-bold uppercase" style={{ color: '#E2C063' }}>
                      {cat.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-fluid-sm font-semibold truncate" style={{ color: '#2D2924' }}>{cat.name}</p>
                    <p className="text-fluid-xs truncate" style={{ color: '#9C8F83' }}>{cat.slug}</p>
                  </div>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0"
                    style={
                      cat.isActive
                        ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' }
                        : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' }
                    }
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Right: Edit button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] min-w-[44px] p-0 flex-shrink-0 transition-all duration-150"
                  style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
                  onClick={() => setEditTarget(cat)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--contigo-primary)'
                    e.currentTarget.style.color = 'var(--contigo-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5DDD0'
                    e.currentTarget.style.color = '#6B6560'
                  }}
                >
                  <Pencil className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <CategoryFormModal
          mode="create"
          type="shared"
          allFlat={categories}
          onClose={() => {
            setCreating(false)
            router.refresh()
          }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <CategoryFormModal
          mode="edit"
          type="shared"
          allFlat={categories}
          editTarget={editTarget}
          onClose={() => {
            setEditTarget(null)
            router.refresh()
            toast.success('Category updated')
          }}
        />
      )}
    </div>
  )
}
