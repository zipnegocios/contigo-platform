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
import { GripVertical, Trash2 } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'
import { BLOCK_ICONS } from './blockMeta'

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
  const Icon = BLOCK_ICONS[block.type]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        margin: '1px 6px',
        borderRadius: 7,
        cursor: 'pointer',
        backgroundColor: isActive ? 'rgba(226,192,99,0.1)' : 'transparent',
        transition: 'background 120ms ease',
        listStyle: 'none',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
      }}
      {...attributes}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        style={{
          background: 'none', border: 'none', cursor: 'grab',
          touchAction: 'none', flexShrink: 0, display: 'flex',
          padding: 2, color: 'rgba(255,255,255,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      {/* Block type icon */}
      <span style={{
        width: 24, height: 24, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: isActive ? 'rgba(226,192,99,0.16)' : 'rgba(255,255,255,0.07)',
        transition: 'background 120ms',
      }}>
        <Icon size={13} style={{ color: isActive ? '#E2C063' : 'rgba(255,255,255,0.45)' }} />
      </span>

      {/* Label */}
      <span style={{
        flex: 1, fontSize: '0.78rem', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: isActive ? '#E2C063' : 'rgba(255,255,255,0.72)',
        transition: 'color 120ms',
      }}>
        {BLOCK_LABELS[block.type]}
      </span>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, borderRadius: 4, flexShrink: 0, display: 'flex',
          color: 'rgba(255,255,255,0.25)', transition: 'color 120ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
        aria-label={`Delete ${BLOCK_LABELS[block.type]}`}
      >
        <Trash2 size={13} />
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
      <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>
          No blocks yet.
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ padding: '4px 0', margin: 0 }}>
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
