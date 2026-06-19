'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CategoryNode, FlatCategory, CategoryType, ReorderItem } from '@/types/category'
import { buildCategoryTree } from '@/lib/buildCategoryTree'
import { CategoryTreeNode } from './CategoryTreeNode'
import { CategoryFormModal } from './CategoryFormModal'

interface CategoryTreeViewProps {
  initialFlat: FlatCategory[]
  type: CategoryType
}

export function CategoryTreeView({ initialFlat, type }: CategoryTreeViewProps) {
  const router = useRouter()
  const [flat, setFlat] = useState<FlatCategory[]>(initialFlat)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const tree = buildCategoryTree(flat)
  const rootIds = tree.map((n) => n.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeItem = flat.find((c) => c.id === active.id)
      const overItem = flat.find((c) => c.id === over.id)
      if (!activeItem || !overItem) return

      // Only allow same-parent reorder via DnD
      if (activeItem.parentId !== overItem.parentId) return

      const siblings = flat
        .filter((c) => c.parentId === activeItem.parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const oldIdx = siblings.findIndex((c) => c.id === active.id)
      const newIdx = siblings.findIndex((c) => c.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return

      const reordered = [...siblings]
      const [moved] = reordered.splice(oldIdx, 1)
      reordered.splice(newIdx, 0, moved)

      const updates: ReorderItem[] = reordered.map((c, idx) => ({
        id: c.id,
        orderIndex: idx,
        parentId: c.parentId,
      }))

      // Optimistic update
      const updatedMap = new Map(updates.map((u) => [u.id, u]))
      setFlat((prev) =>
        prev.map((c) => {
          const u = updatedMap.get(c.id)
          return u ? { ...c, orderIndex: u.orderIndex } : c
        }),
      )

      try {
        await fetch('/api/admin/categories/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        })
        router.refresh()
      } catch {
        // Revert on failure
        setFlat(initialFlat)
      }
    },
    [flat, initialFlat, router],
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
          {flat.length} {flat.length === 1 ? 'category' : 'categories'} · drag to reorder within same level
        </p>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-semibold transition-all min-h-[44px]"
          style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
        >
          <Plus className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          New root category
        </button>
      </div>

      {tree.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>No categories yet. Create one above.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            {tree.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                allFlat={flat}
                type={type}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {showCreateModal && (
        <CategoryFormModal
          mode="create"
          type={type}
          allFlat={flat}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
