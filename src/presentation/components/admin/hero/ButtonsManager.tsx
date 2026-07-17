'use client'

import { useState } from 'react'
import { GripVertical, ChevronDown, ChevronUp, X, Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { HeroButton, ButtonLinkType, ButtonStyle } from '@/core/entities/HeroConfig'

interface EntityOption { id: string; label: string; slug: string; categorySlug?: string }
interface FormOption { id: string; name: string; slug: string }

interface Props {
  buttons: HeroButton[]
  serviceOptions: EntityOption[]
  projectOptions: EntityOption[]
  formOptions: FormOption[]
  onChange: (buttons: HeroButton[]) => void
}

function linkLabel(btn: HeroButton): string {
  if (btn.linkType === 'scroll') return `#${btn.scrollTarget || btn.href}`
  if (btn.linkType === 'service') return btn.entityLabel ? `Service: ${btn.entityLabel}` : btn.href
  if (btn.linkType === 'project') return btn.entityLabel ? `Project: ${btn.entityLabel}` : btn.href
  if (btn.linkType === 'form') return btn.formName ? `Form: ${btn.formName}` : '—'
  return btn.href || '—'
}

interface SortableButtonProps {
  button: HeroButton
  index: number
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onChange: (patch: Partial<HeroButton>) => void
  serviceOptions: EntityOption[]
  projectOptions: EntityOption[]
  formOptions: FormOption[]
}

function SortableButton({ button, expanded, onToggle, onDelete, onChange, serviceOptions, projectOptions, formOptions }: SortableButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: button.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid #E5DDD0',
    borderRadius: 6, fontSize: '0.875rem', color: '#2D2924', background: '#fff',
    outline: 'none',
  }

  return (
    <div ref={setNodeRef} style={{ ...style, border: '1px solid #E5DDD0', borderRadius: 8, background: '#fff', marginBottom: 8 }}>
      {/* Header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }}
        onClick={onToggle}
      >
        <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#C5B99A', display: 'flex' }} onClick={(e) => e.stopPropagation()}>
          <GripVertical size={16} />
        </span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          background: button.style === 'primary' ? '#E2C063' : 'transparent',
          border: button.style === 'primary' ? 'none' : '1px solid #E2C063',
          color: button.style === 'primary' ? '#2D2924' : '#8B7440',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {button.style}
        </span>
        <span style={{ flex: 1, fontWeight: 500, fontSize: '0.875rem', color: '#2D2924', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {button.label || 'Untitled button'}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#6B6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
          {linkLabel(button)}
        </span>
        {expanded ? <ChevronUp size={14} color="#6B6560" /> : <ChevronDown size={14} color="#6B6560" />}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B99A', display: 'flex', padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid #E5DDD0', padding: '12px 12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Label */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Label</label>
              <input
                style={inputStyle}
                value={button.label}
                onChange={(e) => onChange({ label: e.target.value })}
              />
            </div>
            {/* Style */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Style</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['primary', 'secondary'] as ButtonStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onChange({ style: s })}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      textTransform: 'capitalize',
                      background: button.style === s ? '#E2C063' : '#fff',
                      border: button.style === s ? 'none' : '1px solid #E5DDD0',
                      color: button.style === s ? '#2D2924' : '#6B6560',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Link type */}
          <div style={{ marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>Link type</label>
            <select
              style={{ ...inputStyle }}
              value={button.linkType}
              onChange={(e) => onChange({ linkType: e.target.value as ButtonLinkType, href: '', scrollTarget: undefined, entityId: undefined, entityLabel: undefined, formId: undefined, formSlug: undefined, formName: undefined })}
            >
              <option value="scroll">Page section (scroll)</option>
              <option value="custom">Custom URL</option>
              <option value="service">Service page</option>
              <option value="project">Project page</option>
              <option value="form">Open form (modal)</option>
            </select>
          </div>

          {/* Link target */}
          <div style={{ marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>
              {button.linkType === 'scroll' ? 'Section ID' : button.linkType === 'custom' ? 'URL' : button.linkType === 'service' ? 'Service' : button.linkType === 'form' ? 'Form' : 'Project'}
            </label>
            {button.linkType === 'scroll' && (
              <input
                style={inputStyle}
                placeholder="e.g. services, contact"
                value={button.scrollTarget ?? ''}
                onChange={(e) => onChange({ scrollTarget: e.target.value, href: `#${e.target.value}` })}
              />
            )}
            {button.linkType === 'custom' && (
              <input
                style={inputStyle}
                placeholder="https://..."
                value={button.href}
                onChange={(e) => onChange({ href: e.target.value })}
              />
            )}
            {button.linkType === 'service' && (
              <select
                style={inputStyle}
                value={button.entityId ?? ''}
                onChange={(e) => {
                  const opt = serviceOptions.find((s) => s.id === e.target.value)
                  if (opt) onChange({ entityId: opt.id, entityLabel: opt.label, href: `/services/${opt.slug}` })
                }}
              >
                <option value="">Select a service…</option>
                {serviceOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            )}
            {button.linkType === 'project' && (
              <select
                style={inputStyle}
                value={button.entityId ?? ''}
                onChange={(e) => {
                  const opt = projectOptions.find((p) => p.id === e.target.value)
                  if (opt) onChange({ entityId: opt.id, entityLabel: opt.label, href: `/projects/${opt.categorySlug ?? ''}/${opt.slug}` })
                }}
              >
                <option value="">Select a project…</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            )}
            {button.linkType === 'form' && (
              <select
                style={inputStyle}
                value={button.formId ?? ''}
                onChange={(e) => {
                  const opt = formOptions.find((f) => f.id === e.target.value)
                  if (opt) onChange({ formId: opt.id, formSlug: opt.slug, formName: opt.name, href: '' })
                }}
              >
                <option value="">Select a form…</option>
                {formOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ButtonsManager({ buttons, serviceOptions, projectOptions, formOptions, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = buttons.findIndex((b) => b.id === active.id)
      const newIdx = buttons.findIndex((b) => b.id === over.id)
      onChange(arrayMove(buttons, oldIdx, newIdx))
    }
  }

  function addButton() {
    const newBtn: HeroButton = {
      id: crypto.randomUUID(),
      label: 'Button',
      style: 'secondary',
      linkType: 'scroll',
      href: '',
    }
    onChange([...buttons, newBtn])
    setExpandedId(newBtn.id)
  }

  function updateButton(id: string, patch: Partial<HeroButton>) {
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={buttons.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {buttons.map((btn, i) => (
            <SortableButton
              key={btn.id}
              button={btn}
              index={i}
              expanded={expandedId === btn.id}
              onToggle={() => setExpandedId(expandedId === btn.id ? null : btn.id)}
              onDelete={() => {
                onChange(buttons.filter((b) => b.id !== btn.id))
                if (expandedId === btn.id) setExpandedId(null)
              }}
              onChange={(patch) => updateButton(btn.id, patch)}
              serviceOptions={serviceOptions}
              projectOptions={projectOptions}
              formOptions={formOptions}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={addButton}
        disabled={buttons.length >= 3}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          border: '1px dashed #E5DDD0', borderRadius: 8, background: 'transparent',
          fontSize: '0.8rem', color: buttons.length >= 3 ? '#C5B99A' : '#6B6560',
          cursor: buttons.length >= 3 ? 'not-allowed' : 'pointer',
          width: '100%', justifyContent: 'center',
        }}
      >
        <Plus size={14} /> Add button {buttons.length >= 3 ? '(max 3)' : ''}
      </button>
    </div>
  )
}
