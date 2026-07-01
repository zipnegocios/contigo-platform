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
import { FIELD_TYPE_REGISTRY } from '@/core/form-schema/fieldTypes'
import { FieldConfigPanel } from './FieldConfigPanel'
import { FormVersionsDrawer } from './FormVersionsDrawer'

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: '$', USD: '$', EUR: '€', GBP: '£', NZD: '$',
  CAD: '$', JPY: '¥', CHF: 'Fr', SGD: '$', HKD: '$',
}

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
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E5DDD0',
    borderRadius: 6, fontSize: '0.875rem', background: '#fafafa',
    boxSizing: 'border-box', color: '#6B6560',
  }
  const descriptor = FIELD_TYPE_REGISTRY[field.type]
  const renderer   = descriptor?.renderer
  const t = field.type

  // ── Layout/nav/system non-interactive types ──────────────────────────────
  if (t === 'divider')
    return <hr style={{ border: 'none', borderTop: '1px solid #E5DDD0', margin: '0.5rem 0' }} />

  if (t === 'spacer')
    return <div style={{ height: field.colSpan ? `${field.colSpan * 8}px` : '32px' }} />

  if (t === 'step') {
    return (
      <div style={{ borderLeft: '3px solid #E2C063', paddingLeft: 12, margin: '0.75rem 0' }}>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2D2924', margin: 0 }}>
          {field.stepTitle ?? field.label}
        </p>
        {field.stepDescription && (
          <p style={{ fontSize: '0.78rem', color: '#6B6560', marginTop: 2, marginBottom: 0 }}>
            {field.stepDescription}
          </p>
        )}
      </div>
    )
  }

  if (t === 'heading_block') {
    const level = field.headingLevel ?? 2
    const sizes = ['2rem', '1.5rem', '1.25rem', '1.1rem', '1rem', '0.9rem']
    return (
      <div style={{ fontWeight: 700, fontSize: sizes[level - 1], color: '#2D2924', margin: '0.5rem 0' }}>
        {field.content ?? field.label}
      </div>
    )
  }

  if (t === 'paragraph_block') {
    return (
      <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#4a4540', margin: 0 }}>
        {field.content
          ? field.content
          : <span style={{ fontStyle: 'italic', color: '#9B968F' }}>(Paragraph text — set content in the panel)</span>
        }
      </p>
    )
  }

  if (t === 'html_embed') {
    return (
      <div style={{
        background: '#F5EFE8', border: '1px dashed #E5DDD0', borderRadius: 6,
        padding: '0.6rem', fontSize: '0.75rem', fontFamily: 'monospace',
        color: '#6B6560', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {field.content
          ? (field.content.length > 200 ? field.content.slice(0, 200) + '…' : field.content)
          : '<!-- HTML embed — add content in the panel -->'}
      </div>
    )
  }

  if (renderer === 'NavRenderer') {
    const navBtn = (label: string, isPrimary: boolean) => (
      <button disabled style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0.45rem 1rem', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600,
        cursor: 'default', border: isPrimary ? 'none' : '1px solid #E5DDD0',
        background: isPrimary ? '#E2C063' : 'transparent',
        color: isPrimary ? '#2D2924' : '#6B6560',
      }}>{label}</button>
    )
    if (t === 'back_button') return navBtn(`← ${field.label}`, false)
    if (t === 'submit_button' || t === 'next_button' || t === 'save_and_continue') return navBtn(field.label, true)
    if (t === 'progress_bar' || t === 'stepper' || t === 'breadcrumbs') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              width: 28, height: 28, borderRadius: '50%',
              background: n === 1 ? '#E2C063' : '#E5DDD0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700,
              color: n === 1 ? '#2D2924' : '#6B6560',
            }}>{n}</div>
          ))}
        </div>
      )
    }
    return <div style={{ fontSize: '0.8rem', color: '#6B6560', fontStyle: 'italic' }}>[{fieldTypeLabel(t)}]</div>
  }

  if (renderer === 'LayoutRenderer') {
    return (
      <div style={{
        border: '1px dashed #E5DDD0', borderRadius: 6, padding: '0.5rem',
        fontSize: '0.75rem', color: '#6B6560', fontStyle: 'italic',
      }}>
        [{fieldTypeLabel(t)}]
      </div>
    )
  }

  if (renderer === 'SystemFieldRenderer') {
    return (
      <div style={{
        background: '#F5EFE8', border: '1px solid #E5DDD0', borderRadius: 6,
        padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#9B968F', fontStyle: 'italic',
      }}>
        {fieldTypeLabel(t)} (auto-populated)
      </div>
    )
  }

  // ── Data field controls ─────────────────────────────────────────────────
  let control: React.ReactNode = null

  if (renderer === 'TextInputRenderer') {
    if (t === 'currency') {
      const sym = CURRENCY_SYMBOLS[field.currencyCode ?? 'AUD'] ?? '$'
      control = (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5DDD0', borderRadius: 6, background: '#fafafa', overflow: 'hidden' }}>
          <span style={{ padding: '0.5rem 0.6rem', background: '#F5EFE8', borderRight: '1px solid #E5DDD0', fontSize: '0.85rem', color: '#6B6560', fontWeight: 600 }}>{sym}</span>
          <input readOnly type="number" placeholder="0.00" style={{ ...inputBase, border: 'none', borderRadius: 0, flex: 1 }} />
        </div>
      )
    } else if (t === 'percentage') {
      control = (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5DDD0', borderRadius: 6, background: '#fafafa', overflow: 'hidden' }}>
          <input readOnly type="number" placeholder="0" style={{ ...inputBase, border: 'none', borderRadius: 0, flex: 1 }} />
          <span style={{ padding: '0.5rem 0.6rem', background: '#F5EFE8', borderLeft: '1px solid #E5DDD0', fontSize: '0.85rem', color: '#6B6560' }}>%</span>
        </div>
      )
    } else if (t === 'number') {
      control = <input readOnly type="number" placeholder={field.placeholder ?? '0'} style={inputBase} />
    } else if (t === 'hidden') {
      control = <div style={{ ...inputBase, background: '#F5EFE8', fontSize: '0.75rem', fontStyle: 'italic', color: '#9B968F' }}>Hidden field (not shown to user)</div>
    } else {
      const typeAttr = t === 'email' ? 'email' : t === 'phone' ? 'tel' : t === 'url' ? 'url' : t === 'password' ? 'password' : 'text'
      control = <input readOnly type={typeAttr} placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`} style={inputBase} />
    }
  }

  else if (renderer === 'TextareaRenderer') {
    control = <textarea readOnly rows={3} placeholder={field.placeholder ?? ''} style={{ ...inputBase, resize: 'none' }} />
  }

  else if (renderer === 'ChoiceRenderer') {
    const opts = field.options ?? []

    if (t === 'switch') {
      control = (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <div style={{ width: 40, height: 22, borderRadius: 11, background: '#E5DDD0', position: 'relative' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontSize: '0.875rem', color: '#6B6560' }}>{field.label}</span>
        </label>
      )
    } else if (t === 'yes_no') {
      control = (
        <div style={{ display: 'flex', gap: 8 }}>
          {['Yes', 'No'].map(opt => (
            <button key={opt} disabled style={{ padding: '0.4rem 1.2rem', border: '1px solid #E5DDD0', borderRadius: 6, background: '#fafafa', fontSize: '0.85rem', color: '#6B6560', cursor: 'default' }}>{opt}</button>
          ))}
        </div>
      )
    } else if (t === 'checkbox') {
      control = (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#2D2924' }}>
          <input type="checkbox" readOnly style={{ marginTop: 2, accentColor: '#E2C063' }} />
          <span>{field.label}</span>
        </label>
      )
    } else if (t === 'checkbox_group') {
      control = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(opts.length > 0 ? opts : ['Option A', 'Option B']).map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#2D2924' }}>
              <input type="checkbox" readOnly style={{ accentColor: '#E2C063' }} /> {o}
            </label>
          ))}
        </div>
      )
    } else if (t === 'radio_group') {
      control = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(opts.length > 0 ? opts : ['Option A', 'Option B']).map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#2D2924' }}>
              <input type="radio" readOnly style={{ accentColor: '#E2C063' }} /> {o}
            </label>
          ))}
        </div>
      )
    } else if (t === 'button_group' || t === 'segmented') {
      control = (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C']).map((o, i) => (
            <button key={o} disabled style={{
              padding: '0.35rem 0.9rem',
              border: '1px solid #E5DDD0',
              borderRadius: t === 'segmented' ? 0 : 6,
              background: i === 0 ? '#E2C063' : '#fafafa',
              fontSize: '0.8rem',
              color: i === 0 ? '#2D2924' : '#6B6560',
              cursor: 'default',
              fontWeight: i === 0 ? 700 : 400,
            }}>{o}</button>
          ))}
        </div>
      )
    } else if (t === 'multi_select') {
      control = (
        <select multiple disabled size={Math.min(opts.length > 0 ? opts.length : 3, 4)} style={inputBase}>
          {(opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C']).map(o => <option key={o}>{o}</option>)}
        </select>
      )
    } else if (t === 'tags_input') {
      control = (
        <div style={{ ...inputBase, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minHeight: 42 }}>
          {opts.slice(0, 3).map(o => (
            <span key={o} style={{ background: '#E2C063', color: '#2D2924', borderRadius: 4, padding: '1px 7px', fontSize: '0.78rem', fontWeight: 600 }}>{o}</span>
          ))}
          <span style={{ fontSize: '0.8rem', color: '#9B968F', fontStyle: 'italic' }}>+ type to add…</span>
        </div>
      )
    } else {
      control = (
        <select disabled style={inputBase}>
          <option>{field.placeholder ?? 'Select…'}</option>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      )
    }
  }

  else if (renderer === 'DateTimeRenderer') {
    if (t === 'date_range') {
      control = (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" readOnly style={{ ...inputBase, flex: 1 }} />
          <span style={{ color: '#6B6560', fontSize: '0.8rem' }}>→</span>
          <input type="date" readOnly style={{ ...inputBase, flex: 1 }} />
        </div>
      )
    } else if (t === 'duration') {
      control = (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['HH', 'MM', 'SS'] as const).map((p, i) => (
            <span key={p} style={{ display: 'contents' }}>
              <input readOnly placeholder={p} style={{ ...inputBase, width: 60 }} />
              {i < 2 && <span style={{ color: '#6B6560' }}>:</span>}
            </span>
          ))}
        </div>
      )
    } else if (t === 'month_year') {
      control = <input type="month" readOnly style={inputBase} />
    } else {
      const typeAttr = t === 'time' ? 'time' : t === 'datetime' ? 'datetime-local' : 'date'
      control = <input type={typeAttr} readOnly style={inputBase} />
    }
  }

  else if (renderer === 'RangeRenderer') {
    if (t === 'rating') {
      const max = field.maxRating ?? 5
      const rStyle = field.ratingStyle ?? 'star'
      const glyphs: Record<string, string> = { star: '★', heart: '♥', number: '' }
      control = (
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: max }, (_, i) => (
            <span key={i} style={{ fontSize: '1.4rem', color: i < 3 ? '#E2C063' : '#E5DDD0', cursor: 'default' }}>
              {rStyle === 'number' ? String(i + 1) : glyphs[rStyle]}
            </span>
          ))}
        </div>
      )
    } else {
      const min = field.validation?.min ?? 0
      const max = field.validation?.max ?? 100
      const stepVal = field.step ?? 1
      if (t === 'range_slider') {
        control = (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input type="range" readOnly min={min} max={max} step={stepVal} defaultValue={min} style={{ flex: 1, accentColor: '#E2C063' }} />
              <input type="range" readOnly min={min} max={max} step={stepVal} defaultValue={max} style={{ flex: 1, accentColor: '#E2C063' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9B968F' }}>
              <span>{min}</span><span>{max}</span>
            </div>
          </div>
        )
      } else if (t === 'number_stepper') {
        control = (
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5DDD0', borderRadius: 6, overflow: 'hidden', width: 130 }}>
            <button disabled style={{ padding: '0.5rem 0.7rem', background: '#F5EFE8', border: 'none', fontSize: '1rem', color: '#6B6560', cursor: 'default' }}>−</button>
            <input readOnly type="number" defaultValue={min} style={{ ...inputBase, border: 'none', borderRadius: 0, textAlign: 'center', width: 50 }} />
            <button disabled style={{ padding: '0.5rem 0.7rem', background: '#F5EFE8', border: 'none', fontSize: '1rem', color: '#6B6560', cursor: 'default' }}>+</button>
          </div>
        )
      } else {
        control = (
          <div>
            <input type="range" readOnly min={min} max={max} step={stepVal} defaultValue={(min + max) / 2} style={{ width: '100%', accentColor: '#E2C063' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9B968F' }}>
              <span>{min}</span><span>{max}</span>
            </div>
          </div>
        )
      }
    }
  }

  else if (renderer === 'FileRenderer') {
    if (t === 'signature') {
      control = (
        <div style={{ border: '1px solid #E5DDD0', borderRadius: 6, background: '#fafafa', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B968F', fontSize: '0.78rem', fontStyle: 'italic' }}>
          Signature area
        </div>
      )
    } else {
      const isMulti = t === 'file_upload_multi' || t === 'dropzone'
      control = (
        <div style={{ border: '2px dashed #E5DDD0', borderRadius: 8, background: '#F5EFE8', padding: '1.2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#6B6560', margin: 0 }}>
            {t === 'image_upload' ? '🖼️ Click or drag to upload image' : isMulti ? '📁 Click or drag files here' : '📎 Click or drag file here'}
          </p>
          {field.acceptedFileTypes && field.acceptedFileTypes.length > 0 && (
            <p style={{ fontSize: '0.7rem', color: '#9B968F', margin: '4px 0 0' }}>{field.acceptedFileTypes.join(', ')}</p>
          )}
          {field.maxFileSize && (
            <p style={{ fontSize: '0.7rem', color: '#9B968F', margin: '2px 0 0' }}>Max {field.maxFileSize} MB</p>
          )}
        </div>
      )
    }
  }

  else if (renderer === 'CompositeRenderer') {
    if (t === 'full_name') {
      control = (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input readOnly placeholder="First name" style={inputBase} />
          <input readOnly placeholder="Last name" style={inputBase} />
        </div>
      )
    } else if (t === 'address') {
      control = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input readOnly placeholder="Street address" style={inputBase} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input readOnly placeholder="City" style={inputBase} />
            <input readOnly placeholder="State" style={inputBase} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input readOnly placeholder="Postcode" style={inputBase} />
            <input readOnly placeholder="Country" style={inputBase} />
          </div>
        </div>
      )
    } else if (t === 'country_select') {
      control = (
        <select disabled style={inputBase}>
          <option>Australia</option><option>New Zealand</option>
          <option>United States</option><option>United Kingdom</option>
        </select>
      )
    } else if (t === 'state_select') {
      control = (
        <select disabled style={inputBase}>
          <option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option>
        </select>
      )
    } else {
      control = <input readOnly placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`} style={inputBase} />
    }
  }

  else if (renderer === 'LocationRenderer') {
    control = (
      <div style={{ border: '1px solid #E5DDD0', borderRadius: 6, background: '#F5EFE8', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6560', fontSize: '0.78rem' }}>
        📍 {fieldTypeLabel(t)}
      </div>
    )
  }

  else if (renderer === 'ConsentRenderer') {
    if (t === 'captcha') {
      control = (
        <div style={{ border: '1px solid #E5DDD0', borderRadius: 6, background: '#F5EFE8', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, border: '1px solid #E5DDD0', borderRadius: 3, background: '#fff' }} />
          <span style={{ fontSize: '0.85rem', color: '#6B6560' }}>I'm not a robot</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9B968F' }}>reCAPTCHA</span>
        </div>
      )
    } else {
      control = (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#2D2924' }}>
          <input type="checkbox" readOnly style={{ marginTop: 2, accentColor: '#E2C063' }} />
          <span>{field.label}</span>
        </label>
      )
    }
  }

  else {
    control = (
      <div style={{ ...inputBase, background: '#F5EFE8', color: '#6B6560', fontSize: '0.78rem', fontStyle: 'italic' }}>
        {fieldTypeLabel(t)} — configure in the panel
      </div>
    )
  }

  const showLabel = !['checkbox', 'consent_checkbox', 'terms_acceptance', 'captcha',
    'switch', 'yes_no', 'submit_button', 'next_button', 'back_button', 'save_and_continue'].includes(t)

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {showLabel && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2D2924', marginBottom: 4 }}>
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
