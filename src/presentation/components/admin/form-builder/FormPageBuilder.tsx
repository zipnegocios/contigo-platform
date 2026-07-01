'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  History,
  Save,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import type { FormField } from '@/core/form-schema/FormSchema'
import type { FormVersionSummary } from '@/core/repositories/IFormRepository'
import { FIELD_CATEGORIES, fieldTypeLabel } from './fieldCategories'
import { FieldConfigPanel } from './FieldConfigPanel'
import { FormVersionsDrawer } from './FormVersionsDrawer'

interface Props {
  slug: string
  formName: string
  initialFields: FormField[]
  versions: FormVersionSummary[]
}

// ─── Field type grid item ─────────────────────────────────────────────────────

function FieldTypeItem({ type, onAdd }: { type: string; onAdd: (type: string) => void }) {
  return (
    <button
      onClick={() => onAdd(type)}
      title={fieldTypeLabel(type)}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7,
        padding: '0.5rem 0.4rem',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background 150ms, border-color 150ms',
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.3,
        wordBreak: 'break-word',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(226,192,99,0.15)'
        e.currentTarget.style.borderColor = 'rgba(226,192,99,0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      {fieldTypeLabel(type)}
    </button>
  )
}

// ─── Left panel: Field Types tab ──────────────────────────────────────────────

function FieldTypesTab({ onAdd }: { onAdd: (type: string) => void }) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const query = search.toLowerCase()
  const filteredCategories = FIELD_CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) => !query || fieldTypeLabel(t).toLowerCase().includes(query)),
  })).filter((cat) => cat.types.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search field types..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7,
              padding: '0.45rem 0.6rem 0.45rem 1.75rem',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.75rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {filteredCategories.map((cat) => {
          const isCollapsed = collapsed[cat.name] && !search
          return (
            <div key={cat.name} style={{ marginBottom: '0.5rem' }}>
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [cat.name]: !p[cat.name] }))}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0.3rem 0.4rem',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                {cat.name}
                <ChevronRight
                  size={10}
                  style={{
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 150ms',
                  }}
                />
              </button>
              {!isCollapsed && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  {cat.types.map((type) => (
                    <FieldTypeItem key={type} type={type} onAdd={onAdd} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sortable field row in Fields tab ─────────────────────────────────────────

function SortableFieldRow({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: isSelected ? 'rgba(226,192,99,0.12)' : 'rgba(255,255,255,0.04)',
        border: isSelected ? '1.5px solid rgba(226,192,99,0.6)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7,
        padding: '0.5rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        marginBottom: 4,
      }}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.35)',
          cursor: 'grab',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <GripVertical size={14} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {field.label}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
          {fieldTypeLabel(field.type)}
          {field.locked && (
            <span style={{ marginLeft: 5, color: '#E2C063' }}>
              <Lock size={9} style={{ display: 'inline', verticalAlign: 'middle' }} /> System
            </span>
          )}
        </div>
      </div>
      {!field.locked && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,100,100,0.55)',
            cursor: 'pointer',
            padding: 2,
            flexShrink: 0,
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ─── Left panel: Fields tab ───────────────────────────────────────────────────

function FieldsTab({
  fields,
  selectedFieldId,
  onSelect,
  onDelete,
  onReorder,
  onSwitchToTypes,
}: {
  fields: FormField[]
  selectedFieldId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (fields: FormField[]) => void
  onSwitchToTypes: () => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = fields.findIndex((f) => f.id === active.id)
      const newIdx = fields.findIndex((f) => f.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1) {
        onReorder(arrayMove(fields, oldIdx, newIdx))
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '0.6rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {fields.length} field{fields.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onSwitchToTypes}
          style={{
            background: 'rgba(226,192,99,0.15)',
            border: '1px solid rgba(226,192,99,0.3)',
            borderRadius: 5,
            color: '#E2C063',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '3px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Plus size={10} /> Add
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {fields.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', marginTop: '2rem' }}>
            No fields yet. Switch to Field Types to add one.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  isSelected={field.id === selectedFieldId}
                  onSelect={() => onSelect(field.id)}
                  onDelete={() => onDelete(field.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

// ─── Canvas preview ───────────────────────────────────────────────────────────

function FieldPreview({ field }: { field: FormField }) {
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #E5DDD0',
    borderRadius: 6,
    fontSize: '0.875rem',
    background: '#fafafa',
    boxSizing: 'border-box',
    color: '#6B6560',
  }

  const type = field.type

  let control: React.ReactNode = null

  if (['text', 'email', 'phone', 'url', 'slug', 'masked', 'postcode', 'password', 'hidden'].includes(type)) {
    control = <input readOnly placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`} style={inputBase} />
  } else if (['textarea', 'rich_text'].includes(type)) {
    control = <textarea readOnly rows={3} placeholder={field.placeholder ?? ''} style={{ ...inputBase, resize: 'none' }} />
  } else if (type === 'select' || type === 'combobox') {
    control = (
      <select disabled style={inputBase}>
        <option>Select…</option>
        {(field.options ?? []).map((o) => <option key={o}>{o}</option>)}
      </select>
    )
  } else if (['checkbox', 'consent_checkbox', 'terms_acceptance'].includes(type)) {
    control = (
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#2D2924' }}>
        <input type="checkbox" readOnly style={{ marginTop: 2, accentColor: '#E2C063' }} />
        <span>{field.label}</span>
      </label>
    )
  } else if (type === 'radio_group') {
    control = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(field.options ?? ['Option A', 'Option B']).map((o) => (
          <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#2D2924' }}>
            <input type="radio" readOnly style={{ accentColor: '#E2C063' }} /> {o}
          </label>
        ))}
      </div>
    )
  } else if (type === 'number' || type === 'currency' || type === 'percentage') {
    control = <input type="number" readOnly placeholder="0" style={inputBase} />
  } else if (type === 'date' || type === 'datetime' || type === 'time') {
    control = <input type={type === 'time' ? 'time' : type === 'datetime' ? 'datetime-local' : 'date'} readOnly style={inputBase} />
  } else if (type === 'submit_button' || type === 'next_button') {
    control = (
      <button
        disabled
        style={{
          background: '#E2C063',
          color: '#2D2924',
          border: 'none',
          borderRadius: 6,
          padding: '0.6rem 1.5rem',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'default',
        }}
      >
        {field.label}
      </button>
    )
  } else {
    control = (
      <div
        style={{
          ...inputBase,
          background: '#F5EFE8',
          color: '#6B6560',
          fontSize: '0.78rem',
          fontStyle: 'italic',
        }}
      >
        {fieldTypeLabel(type)} input
      </div>
    )
  }

  // Consent/checkbox: label is the control itself
  const showLabel = !['checkbox', 'consent_checkbox', 'terms_acceptance', 'submit_button', 'next_button'].includes(type)

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {showLabel && (
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#2D2924',
            marginBottom: 4,
          }}
        >
          {field.label}
          {field.required && <span style={{ color: '#e87070', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {control}
      {field.helpText && (
        <p style={{ fontSize: '0.72rem', color: '#6B6560', marginTop: 3 }}>{field.helpText}</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FormPageBuilder({ slug, formName, initialFields, versions }: Props) {
  const router = useRouter()
  const [fields, setFields] = useState<FormField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<'field-types' | 'fields'>('field-types')
  const [saving, setSaving] = useState(false)
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false)
  const [currentVersionN, setCurrentVersionN] = useState<number>(() => {
    const active = versions.find((v) => v.isActive)
    return active?.version ?? versions[0]?.version ?? 1
  })

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  function addField(type: string) {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: fieldTypeLabel(type),
      required: false,
    }
    setFields((prev) => [...prev, newField])
    setSelectedFieldId(newField.id)
    setPanelTab('fields')
  }

  function deleteField(id: string) {
    const f = fields.find((x) => x.id === id)
    if (f?.locked) return
    setFields((prev) => prev.filter((x) => x.id !== id))
    setSelectedFieldId((cur) => (cur === id ? null : cur))
  }

  function updateField(updated: FormField) {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const schema = { steps: [{ fields }] }
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
      setCurrentVersionN(json.version)
      toast.success(`Saved as version ${json.version}`)
    } catch {
      toast.error('Could not save form')
    } finally {
      setSaving(false)
    }
  }

  const panelWidth = panelOpen ? 380 : 0

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #E2C063' : '2px solid transparent',
    color: active ? '#E2C063' : 'rgba(255,255,255,0.45)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.75rem',
    padding: '0.6rem 0',
    cursor: 'pointer',
    transition: 'color 150ms, border-color 150ms',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F5EFE8' }}>
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #E5DDD0',
          minHeight: 52,
          padding: '0 1rem',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setPanelOpen((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#6B6560', cursor: 'pointer', padding: 4, borderRadius: 5 }}
            title={panelOpen ? 'Close panel' : 'Open panel'}
          >
            {panelOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <Link
            href="/admin/leads/management/form-builder"
            style={{ fontSize: '0.8rem', color: '#6B6560', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Form Builder
          </Link>
          <ChevronRight size={14} style={{ color: '#C5BCAF' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2D2924' }}>{formName}</span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setVersionDrawerOpen(true)}
            style={{
              background: 'none',
              border: '1px solid #E5DDD0',
              borderRadius: 7,
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              color: '#6B6560',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <History size={14} />
            Version {currentVersionN}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#E2C063',
              border: 'none',
              borderRadius: 7,
              padding: '0.45rem 1.1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#2D2924',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <aside
          style={{
            width: panelWidth,
            minWidth: panelOpen ? 380 : 0,
            background: '#1E1A16',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1)',
            flexShrink: 0,
          }}
        >
          {panelOpen && (
            <>
              {/* Tab bar */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  flexShrink: 0,
                }}
              >
                <button style={tabStyle(panelTab === 'field-types')} onClick={() => setPanelTab('field-types')}>
                  Field Types
                </button>
                <button style={tabStyle(panelTab === 'fields')} onClick={() => setPanelTab('fields')}>
                  Fields ({fields.length})
                </button>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {panelTab === 'field-types' ? (
                  <FieldTypesTab onAdd={addField} />
                ) : (
                  <FieldsTab
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onSelect={(id) => setSelectedFieldId(id)}
                    onDelete={deleteField}
                    onReorder={setFields}
                    onSwitchToTypes={() => setPanelTab('field-types')}
                  />
                )}
              </div>

              {/* Config panel for selected field — rendered in a light card inside the dark panel */}
              {selectedField && panelTab === 'fields' && (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    overflowY: 'auto',
                    maxHeight: '45%',
                    flexShrink: 0,
                    background: '#F5EFE8',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem',
                      // Override FieldConfigPanel's fixed dimensions to fit the embedded context
                      '--field-config-width': '100%',
                      '--field-config-max-height': 'none',
                    } as React.CSSProperties}
                  >
                    <FieldConfigPanel
                      field={selectedField}
                      onChange={updateField}
                      onDelete={() => deleteField(selectedField.id)}
                      onClose={() => setSelectedFieldId(null)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Canvas */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#DDD8D0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '2.5rem 1.5rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
              width: '100%',
              maxWidth: 640,
              minHeight: 480,
              padding: '2.5rem 2.5rem 3rem',
            }}
          >
            {/* Form header */}
            <h2
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#2D2924',
                marginBottom: '1.75rem',
                borderBottom: '1px solid #E5DDD0',
                paddingBottom: '1rem',
              }}
            >
              {formName}
            </h2>

            {/* Field previews */}
            {fields.length === 0 ? (
              <div
                style={{
                  border: '2px dashed #E5DDD0',
                  borderRadius: 8,
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#6B6560',
                }}
              >
                <p style={{ fontWeight: 500, color: '#2D2924', marginBottom: 4 }}>No fields yet</p>
                <p style={{ fontSize: '0.8rem' }}>
                  Click a field type in the panel to start building.
                </p>
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  onClick={() => { setSelectedFieldId(field.id); setPanelTab('fields') }}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    padding: '0.25rem 0.5rem',
                    transition: 'background 150ms',
                    outline: selectedFieldId === field.id ? '2px solid #E2C063' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  <FieldPreview field={field} />
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Version history drawer */}
      <FormVersionsDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        slug={slug}
        versions={versions}
        onRevert={() => { router.refresh() }}
      />
    </div>
  )
}
