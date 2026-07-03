'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GripVertical, ChevronDown, ChevronRight, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CategoryNode, FlatCategory, CategoryType } from '@/types/category'
import { CategoryFormModal } from './CategoryFormModal'

interface CategoryTreeNodeProps {
  node: CategoryNode
  allFlat: FlatCategory[]
  type: CategoryType
  depth?: number
  showTypeChip?: boolean
}

export function CategoryTreeNode({ node, allFlat, type, depth = 0, showTypeChip = false }: CategoryTreeNodeProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const childIds = node.children.map((c) => c.id)
  const indentPx = depth * 20

  async function handleDelete() {
    if (!confirm(`Delete "${node.name}"? Children will become root-level categories.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/categories/${node.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleActive() {
    setTogglingActive(true)
    try {
      await fetch(`/api/admin/categories/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: node.status === 'active' ? 'inactive' : 'active' }),
      })
      router.refresh()
    } finally {
      setTogglingActive(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          marginLeft: indentPx,
          backgroundColor: isDragging ? 'rgba(226,192,99,0.08)' : undefined,
          opacity: node.status === 'active' ? 1 : 0.5,
        }}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--neutral-600)', flexShrink: 0 }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
        </button>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 rounded"
          style={{ color: 'var(--neutral-600)', flexShrink: 0, visibility: node.children.length > 0 ? 'visible' : 'hidden' }}
        >
          {expanded ? <ChevronDown className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" /> : <ChevronRight className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-fluid-sm font-medium truncate" style={{ color: 'var(--neutral-800)' }}>
              {node.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: 'var(--neutral-600)' }}>
              {node.slug}
            </span>
            {showTypeChip && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono capitalize" style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: 'var(--neutral-600)' }}>
                {node.type}
              </span>
            )}
            {node.isSystem && (
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(82,183,136,0.15)', color: '#52B788' }}>
                system
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--neutral-600)' }}>{node.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={togglingActive}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            style={{ color: node.status === 'active' ? '#52B788' : 'var(--neutral-600)' }}
            title={node.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {node.status === 'active' ? <ToggleRight className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" /> : <ToggleLeft className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />}
          </button>
          <button
            type="button"
            onClick={() => setShowAddChildModal(true)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            style={{ color: 'var(--neutral-600)' }}
            title="Add subcategory"
          >
            <Plus className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
          </button>
          {!node.isSystem && (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: 'var(--neutral-600)' }}
              title="Edit"
            >
              <Edit2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
          )}
          {!node.isSystem && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: '#e87070' }}
              title="Delete"
            >
              <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && node.children.length > 0 && (
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              allFlat={allFlat}
              type={type}
              depth={depth + 1}
              showTypeChip={showTypeChip}
            />
          ))}
        </SortableContext>
      )}

      {showEditModal && (
        <CategoryFormModal
          mode="edit"
          type={type}
          allFlat={allFlat}
          editTarget={node}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showAddChildModal && (
        <CategoryFormModal
          mode="create"
          type={type}
          allFlat={allFlat}
          defaultParentId={node.id}
          onClose={() => setShowAddChildModal(false)}
        />
      )}
    </div>
  )
}
