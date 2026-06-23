'use client'

import { useCallback, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock, Save, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import type { FormField, FormSchema } from '@/core/form-schema/FormSchema'
import { FieldPalette } from './FieldPalette'
import { FieldConfigPanel } from './FieldConfigPanel'
import { fieldTypeLabel } from './fieldCategories'

interface FormBuilderProps {
  slug: string
  initialSchema: FormSchema
}

/** Prefix used by `FieldPalette`'s drag sources to mark "new field from palette" vs. a canvas card's own id. */
const PALETTE_DRAG_PREFIX = 'palette-'

// ─── Canvas field card (sortable) ──────────────────────────────────────────

function CanvasFieldCard({
  field,
  isSelected,
  onSelect,
}: {
  field: FormField
  isSelected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
      style={{
        ...style,
        backgroundColor: isSelected ? 'rgba(226,192,99,0.12)' : 'rgba(226,192,99,0.03)',
        border: isSelected ? '1.5px solid var(--contigo-primary)' : '1px solid rgba(226,192,99,0.1)',
      }}
    >
      <button
        type="button"
        className="cursor-grab p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ color: 'var(--neutral-600)' }}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-[clamp(0.875rem,1.75vw,1rem)] h-[clamp(0.875rem,1.75vw,1rem)]" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-fluid-sm font-medium truncate" style={{ color: 'var(--neutral-800)' }}>
            {field.label}
          </span>
          {field.required && (
            <span style={{ color: '#e87070' }}>*</span>
          )}
          {field.locked && (
            <Lock className="w-[clamp(0.625rem,1.25vw,0.75rem)] h-[clamp(0.625rem,1.25vw,0.75rem)]" style={{ color: '#52B788' }} />
          )}
        </div>
        <span className="text-[10px]" style={{ color: 'var(--neutral-600)' }}>
          {fieldTypeLabel(field.type)}
        </span>
      </div>

      <Settings2
        className="w-[clamp(0.875rem,1.75vw,1rem)] h-[clamp(0.875rem,1.75vw,1rem)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--neutral-600)' }}
      />
    </div>
  )
}

// ─── Canvas (droppable + sortable list) ────────────────────────────────────

function Canvas({
  fields,
  selectedFieldId,
  onSelectField,
}: {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' })
  const fieldIds = fields.map((f) => f.id)

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-0 rounded-2xl p-4 space-y-2"
      style={{
        backgroundColor: isOver ? 'rgba(226,192,99,0.06)' : 'transparent',
        border: isOver ? '1.5px dashed var(--contigo-primary)' : '1px dashed rgba(226,192,99,0.15)',
        minHeight: 400,
      }}
    >
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: 'var(--neutral-600)' }}>
          <p className="text-fluid-sm">Drag a field type here from the palette to get started.</p>
        </div>
      ) : (
        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
          {fields.map((field) => (
            <CanvasFieldCard
              key={field.id}
              field={field}
              isSelected={field.id === selectedFieldId}
              onSelect={() => onSelectField(field.id)}
            />
          ))}
        </SortableContext>
      )}
    </div>
  )
}

// ─── Main builder ───────────────────────────────────────────────────────────

/**
 * Admin drag-and-drop form builder (Task 4.2.4). Owns the working copy of
 * the form's `FormSchema` (this task's schemas always have exactly one
 * step — multi-step wizard UI is out of scope, same call Task 4.2.3 made
 * for `<FormRenderer>`) and two `@dnd-kit` interactions sharing one
 * `DndContext`:
 *
 *  1. Canvas-internal reorder — a sortable list of field cards, same
 *     pattern as `CategoryTreeView`/`CategoryTreeNode` (`closestCenter`,
 *     `PointerSensor` + `KeyboardSensor`, optimistic local reorder).
 *  2. Palette-to-canvas add — each palette entry is a `useDraggable` drag
 *     source; the canvas is a single `useDroppable` zone. Dropping a
 *     palette entry appends a brand-new `FormField` (fresh `id` via
 *     `crypto.randomUUID()`, the dragged `type`, a title-cased default
 *     `label`, `required: false`, no `validation`/`options`/`locked`) to
 *     the END of the current step's field list — not inserted at a precise
 *     drop position. The admin then drags the new card into place using
 *     interaction #1. This is the deliberately simpler of the two designs
 *     considered (see Task 4.2.4 brief): precise mid-list insertion during
 *     a palette drag adds real complexity for a one-extra-step UX cost.
 */
export function FormBuilder({ slug, initialSchema }: FormBuilderProps) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fields = schema.steps[0]?.fields ?? []
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const updateFields = useCallback((updater: (fields: FormField[]) => FormField[]) => {
    setSchema((prev) => {
      const steps = [...prev.steps]
      const step = steps[0] ?? { fields: [] }
      steps[0] = { ...step, fields: updater(step.fields) }
      return { ...prev, steps }
    })
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)

      // Interaction #2: palette entry dropped onto the canvas.
      if (activeId.startsWith(PALETTE_DRAG_PREFIX)) {
        if (over.id !== 'canvas-drop-zone' && !fields.some((f) => f.id === over.id)) return

        const data = active.data.current as { fieldType?: string } | undefined
        const fieldType = data?.fieldType
        if (!fieldType) return

        const newField: FormField = {
          id: crypto.randomUUID(),
          type: fieldType,
          label: fieldTypeLabel(fieldType),
          required: false,
        }

        updateFields((current) => [...current, newField])
        setSelectedFieldId(newField.id)
        return
      }

      // Interaction #1: canvas-internal reorder.
      if (active.id === over.id) return
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      updateFields((current) => {
        const reordered = [...current]
        const [moved] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, moved)
        return reordered
      })
    },
    [fields, updateFields],
  )

  function handleFieldChange(updated: FormField) {
    updateFields((current) => current.map((f) => (f.id === updated.id ? updated : f)))
  }

  function handleFieldDelete(id: string) {
    const target = fields.find((f) => f.id === id)
    if (target?.locked) return // defense in depth — delete button is already disabled for locked fields
    updateFields((current) => current.filter((f) => f.id !== id))
    setSelectedFieldId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/forms/${slug}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Could not save form')
        return
      }
      toast.success(`Saved as version ${json.version}`)
    } catch {
      toast.error('Could not save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-fluid-sm font-semibold rounded-lg min-h-[44px] disabled:opacity-50"
            style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
          >
            <Save className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            {saving ? 'Saving…' : 'Save new version'}
          </button>
        </div>

        <div className="flex gap-4 items-start">
          <FieldPalette />

          <Canvas fields={fields} selectedFieldId={selectedFieldId} onSelectField={setSelectedFieldId} />

          {selectedField && (
            <FieldConfigPanel
              field={selectedField}
              onChange={handleFieldChange}
              onDelete={() => handleFieldDelete(selectedField.id)}
              onClose={() => setSelectedFieldId(null)}
            />
          )}
        </div>
      </div>
    </DndContext>
  )
}
