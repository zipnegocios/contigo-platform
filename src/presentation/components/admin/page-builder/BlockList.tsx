'use client'

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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'

interface BlockListProps {
  blocks: PageBlock[]
  activeBlockId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (blocks: PageBlock[]) => void
}

function SortableBlockItem({
  block,
  isActive,
  onSelect,
  onDelete,
}: {
  block: PageBlock
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isActive ? 'rgba(226,192,99,0.08)' : 'transparent',
    borderLeft: isActive ? '2px solid #E2C063' : '2px solid transparent',
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
      onClick={onSelect}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#FAFAF8' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
      {...attributes}
    >
      <button
        {...listeners}
        className="cursor-grab touch-none flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        style={{ color: '#C5BDB5' }}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1 text-fluid-xs font-medium truncate" style={{ color: '#2D2924' }}>
        {BLOCK_LABELS[block.type]}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className="p-1 rounded hover:bg-black/5 flex-shrink-0"
        style={{ color: '#6B6560' }}
        aria-label="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="p-1 rounded hover:bg-red-50 flex-shrink-0"
        style={{ color: '#6B6560' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6560' }}
        aria-label="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  )
}

export function BlockList({ blocks, activeBlockId, onSelect, onDelete, onReorder }: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = blocks.findIndex((b) => b.id === active.id)
    const newIdx = blocks.findIndex((b) => b.id === over.id)
    onReorder(arrayMove(blocks, oldIdx, newIdx))
  }

  if (blocks.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>No blocks yet. Add one above.</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ borderBottom: '1px solid #F5EFE8' }}>
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              isActive={block.id === activeBlockId}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
