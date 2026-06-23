'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { FIELD_CATEGORIES, fieldTypeLabel } from './fieldCategories'

/**
 * Drag source for a single palette entry. `useDraggable`'s `id` is prefixed
 * so the canvas's `onDragEnd` can distinguish "a NEW field type dragged in
 * from the palette" from "an existing canvas field card being reordered"
 * just by inspecting `active.id` — see `FormBuilder.tsx`.
 */
function PaletteEntry({ type }: { type: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', fieldType: type },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab transition-colors"
      style={{
        backgroundColor: isDragging ? 'rgba(226,192,99,0.15)' : 'rgba(226,192,99,0.04)',
        border: '1px solid rgba(226,192,99,0.12)',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
      title={`Drag to add a ${fieldTypeLabel(type)} field`}
    >
      <GripVertical
        className="w-[clamp(0.75rem,1.5vw,0.875rem)] h-[clamp(0.75rem,1.5vw,0.875rem)] flex-shrink-0"
        style={{ color: 'var(--neutral-600)' }}
      />
      <span className="text-fluid-xs font-medium truncate" style={{ color: 'var(--neutral-800)' }}>
        {fieldTypeLabel(type)}
      </span>
    </div>
  )
}

function CategorySection({ name, types }: { name: string; types: readonly string[] }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-1 py-1.5 text-[10px] uppercase tracking-widest font-semibold"
        style={{ color: 'var(--neutral-600)' }}
      >
        {expanded ? (
          <ChevronDown className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
        ) : (
          <ChevronRight className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
        )}
        {name}
        <span className="ml-auto text-[9px] font-normal" style={{ color: 'var(--neutral-600)' }}>
          {types.length}
        </span>
      </button>

      {expanded && (
        <div className="grid gap-1.5 mt-1 mb-3">
          {types.map((type) => (
            <PaletteEntry key={type} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The Form Builder's field palette (Task 4.2.4): 14 categories grouping all
 * 89 `FIELD_TYPE_REGISTRY` entries (see `fieldCategories.ts`). Each entry is
 * a drag source (`useDraggable`); dropping one onto the canvas
 * (`FormBuilder.tsx`'s droppable area) appends a new field of that type to
 * the active step. Purely presentational — holds no schema state itself.
 */
export function FieldPalette() {
  return (
    <aside
      className="flex-shrink-0 rounded-2xl p-3 overflow-y-auto"
      style={{
        width: 280,
        backgroundColor: 'rgba(226,192,99,0.03)',
        border: '1px solid rgba(226,192,99,0.1)',
        maxHeight: 'calc(100vh - 220px)',
      }}
    >
      <p className="text-[10px] uppercase tracking-widest px-1 pb-2" style={{ color: 'var(--neutral-600)' }}>
        Field Types
      </p>
      <div className="space-y-1">
        {FIELD_CATEGORIES.map((category) => (
          <CategorySection key={category.name} name={category.name} types={category.types} />
        ))}
      </div>
    </aside>
  )
}
