'use client'

import { useState, useCallback, useEffect } from 'react'
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
import type { CategoryType, FlatCategory, ReorderItem } from '@/types/category'
import { buildCategoryTree } from '@/lib/buildCategoryTree'
import { CategoryTreeNode } from './CategoryTreeNode'
import { CategoryFormModal } from './CategoryFormModal'

export interface CategoryGroup {
  type: CategoryType
  flat: FlatCategory[]
}

interface CategoryTreeViewProps {
  groups: CategoryGroup[]
}

const GROUP_LABELS: Record<CategoryType, string> = {
  service: 'Services',
  project: 'Projects',
}

function GroupSection({
  type,
  flat,
  setFlat,
  showHeader,
}: {
  type: CategoryType
  flat: FlatCategory[]
  setFlat: (next: FlatCategory[]) => void
  showHeader: boolean
}) {
  const router = useRouter()

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

      // Only allow same-parent reorder via DnD. Both items already belong to
      // this group's flat (filtered by type), so parentId equality alone is
      // sufficient here — there's no cross-type sibling set to worry about.
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
      setFlat(
        flat.map((c) => {
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
        setFlat(flat)
      }
    },
    [flat, setFlat, router],
  )

  return (
    <div className="space-y-2">
      {showHeader && (
        <h3 className="text-fluid-base font-semibold" style={{ color: 'var(--neutral-800)' }}>
          {GROUP_LABELS[type]}
        </h3>
      )}

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
                showTypeChip={showHeader}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

export function CategoryTreeView({ groups }: CategoryTreeViewProps) {
  const [flatByType, setFlatByType] = useState<Record<CategoryType, FlatCategory[]>>(() => {
    const map: Partial<Record<CategoryType, FlatCategory[]>> = {}
    for (const g of groups) map[g.type] = g.flat
    return map as Record<CategoryType, FlatCategory[]>
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Re-sync local state whenever the server provides fresh group data
  // (e.g. after router.refresh() following create/edit/delete/toggle, or
  // when the "All"/"Services"/"Projects" filter changes which groups are
  // passed in). Without this, local state would keep showing stale data
  // for types that were already touched once, since flatByType is only
  // ever set optimistically by drag-and-drop.
  useEffect(() => {
    const map: Partial<Record<CategoryType, FlatCategory[]>> = {}
    for (const g of groups) map[g.type] = g.flat
    setFlatByType(map as Record<CategoryType, FlatCategory[]>)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups])

  const visibleTypes = groups.map((g) => g.type)
  const effectiveFlatByType: Record<CategoryType, FlatCategory[]> = {} as Record<CategoryType, FlatCategory[]>
  for (const g of groups) {
    effectiveFlatByType[g.type] = flatByType[g.type] ?? g.flat
  }

  const totalCount = visibleTypes.reduce((sum, t) => sum + (effectiveFlatByType[t]?.length ?? 0), 0)
  const showGroupHeaders = visibleTypes.length > 1
  const combinedAllFlat = visibleTypes.flatMap((t) => effectiveFlatByType[t])

  // When only one type is visible, "New root category" creates that type
  // directly with no type picker, matching today's behavior. With multiple
  // types visible ("All"), the modal must let the user choose the type.
  const typeSelectable = visibleTypes.length > 1
  const defaultCreateType: CategoryType = visibleTypes[0] ?? 'service'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
          {totalCount} {totalCount === 1 ? 'category' : 'categories'} · drag to reorder within same level
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

      {groups.map((g) => (
        <GroupSection
          key={g.type}
          type={g.type}
          flat={effectiveFlatByType[g.type]}
          setFlat={(next) => setFlatByType((prev) => ({ ...prev, [g.type]: next }))}
          showHeader={showGroupHeaders}
        />
      ))}

      {showCreateModal && (
        <CategoryFormModal
          mode="create"
          type={defaultCreateType}
          typeSelectable={typeSelectable}
          allFlat={combinedAllFlat}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
