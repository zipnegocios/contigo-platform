'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { LayoutGrid, Folder, FolderOpen } from 'lucide-react'
import { MediaCard } from './MediaCard'
import { useMediaLibrary, type MediaObject } from './MediaLibraryContext'

// ─── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenuState {
  item: MediaObject
  x: number
  y: number
}

function ContextMenu({ state, onClose }: { state: ContextMenuState; onClose: () => void }) {
  const { folders, moveToFolder, openDetail, deleteItem } = useMediaLibrary()
  const [showFolderSub, setShowFolderSub] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl overflow-hidden py-1 min-w-[180px]"
        style={{
          top: state.y,
          left: state.x,
          backgroundColor: '#1E1A16',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}
      >
        <MenuItem onClick={() => { openDetail(state.item); onClose() }}>Ver detalles</MenuItem>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <div
          className="relative"
          onMouseEnter={() => setShowFolderSub(true)}
          onMouseLeave={() => setShowFolderSub(false)}
        >
          <MenuItem rightArrow>Mover a carpeta</MenuItem>
          {showFolderSub && (
            <div
              className="absolute left-full top-0 rounded-xl overflow-hidden py-1 min-w-[160px]"
              style={{ backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
            >
              <MenuItem dimmed onClick={() => { moveToFolder(state.item.key, null); onClose() }}>
                Sin carpeta
              </MenuItem>
              {folders.map((f) => (
                <MenuItem key={f.id} onClick={() => { moveToFolder(state.item.key, f.id); onClose() }}>
                  {f.name}
                </MenuItem>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <MenuItem
          danger
          onClick={() => {
            if (confirm(`Eliminar "${state.item.key.split('/').pop()}"?`)) {
              deleteItem(state.item.key)
            }
            onClose()
          }}
        >
          Eliminar
        </MenuItem>
      </div>
    </>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
  dimmed,
  rightArrow,
}: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
  dimmed?: boolean
  rightArrow?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-white/5"
      style={{ color: danger ? '#e87070' : dimmed ? '#6B6560' : '#E8DCC4' }}
    >
      <span>{children}</span>
      {rightArrow && <span style={{ color: '#A89E8C', fontSize: 10 }}>▶</span>}
    </button>
  )
}

// ─── Floating folder targets ─────────────────────────────────────────────────

function DroppableFolderTarget({ folderId, label }: { folderId: string; label: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `float-folder-${folderId}`,
    data: { folderId: folderId === 'unfiled' ? null : folderId },
  })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150"
      style={{
        backgroundColor: isOver ? 'rgba(226,192,99,0.18)' : 'rgba(226,192,99,0.04)',
        border: isOver ? '1.5px solid #E2C063' : '1px solid rgba(226,192,99,0.12)',
        transform: isOver ? 'scale(1.03)' : 'scale(1)',
        color: isOver ? '#E2C063' : '#A89E8C',
      }}
    >
      {isOver ? <FolderOpen size={14} /> : <Folder size={14} />}
      <span className="truncate">{label}</span>
    </div>
  )
}

function FloatingFolderTargets() {
  const { folders, tab } = useMediaLibrary()
  if (tab === 'bank' || folders.length === 0) return null

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl p-3 space-y-2"
      style={{
        backgroundColor: '#16120E',
        border: '1px solid rgba(226,192,99,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        minWidth: 180,
      }}
    >
      <p className="text-[9px] uppercase tracking-widest px-1 pb-1" style={{ color: '#A89E8C' }}>
        Soltar en carpeta
      </p>
      <DroppableFolderTarget folderId="unfiled" label="Sin carpeta" />
      {folders.map((f) => (
        <DroppableFolderTarget key={f.id} folderId={f.id} label={f.name} />
      ))}
    </div>
  )
}

// ─── Main MediaGrid ───────────────────────────────────────────────────────────

export function MediaGrid() {
  const {
    filteredItems,
    loading,
    tags,
    openDetail,
    deleteItem,
    moveToFolder,
  } = useMediaLibrary()

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDragItem = activeDragKey
    ? filteredItems.find((i) => i.key === activeDragKey) ?? null
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragKey(String(event.active.id))
    setContextMenu(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragKey(null)
    const { active, over } = event
    if (!over) return
    const data = over.data.current as { folderId: string | null } | undefined
    if (data !== undefined) {
      await moveToFolder(String(active.id), data.folderId)
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, item: MediaObject) => {
    e.preventDefault()
    setContextMenu({ item, x: e.clientX, y: e.clientY })
  }, [])

  const handleDelete = useCallback(
    async (key: string) => {
      if (!confirm(`Eliminar "${key.split('/').pop()}"?`)) return
      await deleteItem(key)
    },
    [deleteItem]
  )

  const isEmpty = !loading && filteredItems.length === 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ aspectRatio: '4/3', backgroundColor: 'rgba(226,192,99,0.08)' }}
              />
            ))}
          </div>
        ) : isEmpty ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-xl"
            style={{ border: '1px dashed rgba(226,192,99,0.2)', color: '#A89E8C' }}
          >
            <LayoutGrid size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No hay medios que coincidan con los filtros.</p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}
          >
            {filteredItems.map((item) => (
              <MediaCard
                key={item.key}
                item={item}
                tags={tags}
                onOpenDetail={() => openDetail(item)}
                onDelete={() => handleDelete(item.key)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                isDragging={activeDragKey === item.key}
              />
            ))}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeDragItem && (
          <MediaCard
            item={activeDragItem}
            tags={tags}
            onOpenDetail={() => {}}
            onDelete={() => {}}
            onContextMenu={() => {}}
            isMini
          />
        )}
      </DragOverlay>

      {activeDragKey && <FloatingFolderTargets />}

      {contextMenu && (
        <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </DndContext>
  )
}
