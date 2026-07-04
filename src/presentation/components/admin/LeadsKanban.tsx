'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QuoteDTO } from '@/presentation/types/QuoteDTO'
import type { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'
import { useAdminRealtimeMessages } from '@/presentation/providers/AdminRealtimeProvider'

type LeadRow = {
  id: string
  quoteId: string
  stageId: string
  estimatedValue: number | null
  updatedAt: Date
  quote: QuoteDTO | null
}

interface LeadsKanbanProps {
  leads: LeadRow[]
  onLeadsChange: (updater: (prev: LeadRow[]) => LeadRow[]) => void
  pipelineStages: PipelineStageDTO[]
  unreadByLead?: Record<string, number>
}

/** Derives a soft column background + border tint from the stage's stored hex color. */
function stageColumnColors(hexColor: string) {
  const hex = hexColor.replace('#', '')
  const isValid = hex.length === 6
  const r = isValid ? parseInt(hex.slice(0, 2), 16) : 107
  const g = isValid ? parseInt(hex.slice(2, 4), 16) : 101
  const b = isValid ? parseInt(hex.slice(4, 6), 16) : 96
  const headerColor = isValid ? hexColor : '#6B6560'
  return {
    columnBg: `rgba(${r},${g},${b},0.05)`,
    borderColor: `rgba(${r},${g},${b},0.25)`,
    headerColor,
    badgeBg: `rgba(${r},${g},${b},0.2)`,
    badgeText: headerColor,
  }
}

function AddStageModal({ onClose, onCreated }: { onClose: () => void; onCreated: (stage: PipelineStageDTO) => void }) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#0D3C4C')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    setSaving(true)
    setError(null)
    try {
      const key = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const response = await fetch('/api/admin/pipeline-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, label: label.trim(), color }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Failed to create stage')
      }

      const data = await response.json()
      const created: PipelineStageDTO = {
        id: data.stage.id,
        key: data.stage.key,
        label: data.stage.label,
        position: data.stage.position,
        color: data.stage.color,
        isDefault: data.stage.isDefault,
        terminalKind: data.stage.terminalKind ?? null,
        createdAt: new Date(data.stage.createdAt),
      }
      onCreated(created)
      toast.success('List created')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl"
        style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5DDD0' }}>
          <h2 className="text-fluid-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)' }}>
            New List
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 min-h-[44px] min-w-[44px]" style={{ color: 'var(--neutral-600)' }}>
            <X className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-fluid-sm outline-none"
              style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              placeholder="e.g. Negotiating"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-fluid-xs font-medium mb-1" style={{ color: '#6B6560' }}>Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-lg cursor-pointer"
                style={{ border: '1px solid #E5DDD0' }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-fluid-sm outline-none font-mono"
                style={{ backgroundColor: '#F0EBE3', color: 'var(--neutral-800)', border: '1px solid #E5DDD0' }}
              />
            </div>
          </div>

          {error && (
            <p className="text-fluid-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(232,112,112,0.1)', color: '#e87070' }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-fluid-sm rounded-lg min-h-[44px]"
              style={{ color: '#6B6560' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !label.trim()}
              className="flex items-center gap-2 px-5 py-2 text-fluid-sm font-semibold rounded-lg disabled:opacity-50 min-h-[44px]"
              style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
            >
              {saving && <Loader2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)] animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  stage: PipelineStageDTO
  stageLeads: LeadRow[]
  draggedId: string | null
  buildHref: (leadId: string) => string
  onDragStart: (e: React.DragEvent, leadId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetStageId: string) => void
  onRename: (stageId: string, newLabel: string) => Promise<void>
  unreadByLead: Record<string, number>
}

function KanbanColumn({
  stage,
  stageLeads,
  draggedId,
  buildHref,
  onDragStart,
  onDragOver,
  onDrop,
  onRename,
  unreadByLead,
}: KanbanColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(stage.label)
  const [renaming, setRenaming] = useState(false)

  const cfg = stageColumnColors(stage.color)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const commitRename = async () => {
    const trimmed = editValue.trim()
    setIsEditing(false)
    if (!trimmed || trimmed === stage.label) {
      setEditValue(stage.label)
      return
    }
    setRenaming(true)
    try {
      await onRename(stage.id, trimmed)
    } finally {
      setRenaming(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      {/* Column header */}
      <div
        {...attributes}
        {...listeners}
        className="mb-3 flex items-center justify-between px-1 cursor-grab active:cursor-grabbing"
      >
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            disabled={renaming}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRename()
              } else if (e.key === 'Escape') {
                setEditValue(stage.label)
                setIsEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-fluid-xs font-semibold uppercase tracking-wider bg-transparent outline-none border-b"
            style={{ color: cfg.headerColor, borderColor: cfg.headerColor, width: '100%' }}
          />
        ) : (
          <span
            className="text-fluid-xs font-semibold uppercase tracking-wider select-none"
            style={{ color: cfg.headerColor }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            title="Double-click to rename"
          >
            {stage.label}
          </span>
        )}
        <span
          className="text-fluid-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0 ml-2"
          style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
        >
          {stageLeads.length}
        </span>
      </div>

      {/* Column accent line */}
      <div
        className="h-0.5 mb-3 rounded-full"
        style={{ backgroundColor: cfg.headerColor, opacity: 0.4 }}
      />

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, stage.id)}
        className="flex-1 space-y-3 p-3 rounded-xl border-2 border-dashed transition-all min-h-96"
        style={{
          backgroundColor: cfg.columnBg,
          borderColor: cfg.borderColor,
        }}
      >
        {stageLeads.length === 0 ? (
          <div
            className="flex items-center justify-center h-28 text-fluid-xs"
            style={{ color: 'var(--neutral-600)' }}
          >
            Drop here
          </div>
        ) : (
          stageLeads.map((lead) => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => onDragStart(e, lead.id)}
              className="rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #E5DDD0',
                boxShadow: '0 1px 4px rgba(45,41,36,0.06)',
                opacity: draggedId === lead.id ? 0.45 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,41,36,0.12)'
                e.currentTarget.style.borderColor = cfg.borderColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(45,41,36,0.06)'
                e.currentTarget.style.borderColor = 'var(--neutral-200)'
              }}
            >
              <Link href={buildHref(lead.id)} className="block space-y-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-fluid-sm truncate" style={{ color: 'var(--neutral-800)' }}>
                      {lead.quote?.name || 'Unknown'}
                    </p>
                    {unreadByLead[lead.id] > 0 && (
                      <span
                        className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5"
                        style={{
                          minWidth: '18px',
                          height: '18px',
                          backgroundColor: 'rgba(226,192,99,0.2)',
                          color: '#A08040',
                        }}
                        title={`${unreadByLead[lead.id]} unread message${unreadByLead[lead.id] === 1 ? '' : 's'}`}
                      >
                        {unreadByLead[lead.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-fluid-xs truncate" style={{ color: 'var(--neutral-600)' }}>
                    {lead.quote?.email ?? '—'}
                  </p>
                </div>

                {lead.quote?.service && (
                  <span
                    className="inline-block text-fluid-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#A08040' }}
                  >
                    {lead.quote.service}
                  </span>
                )}

                {lead.estimatedValue && (
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: '1px solid #F0E8DC' }}
                  >
                    <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>Est. Value</span>
                    <span
                      className="text-fluid-xs font-bold"
                      style={{ fontFamily: 'var(--font-space)', color: '#15803d' }}
                    >
                      ${(lead.estimatedValue / 100).toFixed(0)}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function LeadsKanban({ leads, onLeadsChange, pipelineStages, unreadByLead = {} }: LeadsKanbanProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stages, setStages] = useState<PipelineStageDTO[]>(pipelineStages)
  const [showAddModal, setShowAddModal] = useState(false)

  // Live source of truth: SSR-provided unreadByLead is only as fresh as the
  // last page load/navigation, and is shown only until the shared admin SSE
  // stream delivers its first snapshot. From then on the live byLead map is
  // a complete sparse map ("absent = 0 unread"), so it fully replaces the
  // SSR prop rather than being spread-merged with it — a spread-merge can
  // only add/override keys, never remove a stale nonzero SSR entry once a
  // lead's unread count drops to zero. Pure client-side state — no
  // router.refresh() here, so in-progress drags are never disrupted.
  const { byLead: liveByLead, connected } = useAdminRealtimeMessages()
  const effectiveUnreadByLead = connected ? liveByLead : unreadByLead

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const buildHref = (leadId: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('leadId', leadId)
    return `/admin/leads?${params.toString()}`
  }

  const groupedByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = leads.filter((l) => l.stageId === stage.id)
      return acc
    },
    {} as Record<string, LeadRow[]>,
  )

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    if (!draggedId || isLoading) return

    const lead = leads.find((l) => l.id === draggedId)
    if (!lead || lead.stageId === targetStageId) {
      setDraggedId(null)
      return
    }

    const targetStage = stages.find((s) => s.id === targetStageId)
    const originalLeads = leads
    onLeadsChange((prev) =>
      prev.map((l) =>
        l.id === draggedId ? { ...l, stageId: targetStageId, updatedAt: new Date() } : l,
      ),
    )
    setDraggedId(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/leads/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStageId }),
      })

      if (!response.ok) throw new Error(`Failed to update lead: ${response.statusText}`)

      toast.success(`Lead moved to ${targetStage?.label ?? 'stage'}`)
    } catch (error) {
      onLeadsChange(() => originalLeads)
      toast.error(error instanceof Error ? error.message : 'Failed to move lead')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleColumnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = stages.findIndex((s) => s.id === active.id)
    const newIdx = stages.findIndex((s) => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = [...stages]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)

    const originalStages = stages
    setStages(reordered)

    try {
      const response = await fetch('/api/admin/pipeline-stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
      })
      if (!response.ok) throw new Error('Failed to reorder lists')
      router.refresh()
    } catch (error) {
      setStages(originalStages)
      toast.error(error instanceof Error ? error.message : 'Failed to reorder lists')
      console.error(error)
    }
  }

  const handleRename = async (stageId: string, newLabel: string) => {
    const originalStages = stages
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, label: newLabel } : s)))

    try {
      const response = await fetch(`/api/admin/pipeline-stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      })
      if (!response.ok) throw new Error('Failed to rename list')
      toast.success('List renamed')
      router.refresh()
    } catch (error) {
      setStages(originalStages)
      toast.error(error instanceof Error ? error.message : 'Failed to rename list')
      console.error(error)
    }
  }

  const handleStageCreated = (stage: PipelineStageDTO) => {
    setStages((prev) => [...prev, stage])
    router.refresh()
  }

  const stageIds = stages.map((s) => s.id)

  return (
    <div>
      <h1
        className="text-fluid-4xl font-semibold mb-6"
        style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--neutral-800)', lineHeight: 1.2 }}
      >
        Lead Pipeline
      </h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
        <SortableContext items={stageIds} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 items-start">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                stageLeads={groupedByStage[stage.id] ?? []}
                draggedId={draggedId}
                buildHref={buildHref}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onRename={handleRename}
                unreadByLead={effectiveUnreadByLead}
              />
            ))}

            {/* Add list column */}
            <div className="flex flex-col">
              <div className="mb-3 px-1" style={{ height: '1.25rem' }} />
              <div className="h-0.5 mb-3 rounded-full opacity-0" />
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex-1 min-h-96 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors text-fluid-sm font-medium"
                style={{ borderColor: 'var(--neutral-200)', color: 'var(--neutral-600)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--contigo-primary)'
                  e.currentTarget.style.color = 'var(--contigo-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)'
                  e.currentTarget.style.color = 'var(--neutral-600)'
                }}
              >
                <Plus className="w-[clamp(0.875rem,1.5vw,1.125rem)] h-[clamp(0.875rem,1.5vw,1.125rem)]" />
                Add list
              </button>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {showAddModal && (
        <AddStageModal onClose={() => setShowAddModal(false)} onCreated={handleStageCreated} />
      )}
    </div>
  )
}
