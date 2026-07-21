'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
import { LayoutGrid, Folder, FolderOpen, X, ChevronDown, Check } from 'lucide-react'
import { MediaCard } from './MediaCard'
import { AssignToEntityModal } from './AssignToEntityModal'
import { useMediaLibrary, type MediaObject } from './MediaLibraryContext'

const PAGE_SIZE = 24

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkActionBar() {
  const {
    selectedKeys, clearSelection, selectAllFiltered,
    bulkMoveToFolder, bulkDelete, bulkAddTag, bulkRemoveTag,
    folders, tags, filteredItems,
  } = useMediaLibrary()

  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const [addTagMenuOpen, setAddTagMenuOpen] = useState(false)
  const [removeTagMenuOpen, setRemoveTagMenuOpen] = useState(false)

  const closeAll = () => { setFolderMenuOpen(false); setAddTagMenuOpen(false); setRemoveTagMenuOpen(false) }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedKeys.length} file${selectedKeys.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
    await bulkDelete()
  }

  return (
    <>
      {/* Backdrop to close menus */}
      {(folderMenuOpen || addTagMenuOpen || removeTagMenuOpen) && (
        <div className="fixed inset-0 z-30" onClick={closeAll} />
      )}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 flex-wrap"
        style={{ backgroundColor: 'rgba(226,192,99,0.1)', border: '1px solid rgba(226,192,99,0.25)' }}
      >
        <span className="text-fluid-xs font-semibold" style={{ color: 'var(--contigo-primary)' }}>
          {selectedKeys.length} selected
        </span>

        <button
          type="button"
          onClick={selectAllFiltered}
          className="text-fluid-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--neutral-600)', border: '1px solid rgba(107,101,96,0.3)' }}
        >
          Select all ({filteredItems.length})
        </button>

        <div className="flex-1" />

        {/* Move to folder */}
        {folders.length > 0 && (
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => { setFolderMenuOpen((v) => !v); setAddTagMenuOpen(false); setRemoveTagMenuOpen(false) }}
              className="flex items-center gap-1 text-fluid-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.08)', border: '1px solid rgba(226,192,99,0.25)', color: 'var(--contigo-primary)' }}
            >
              Move to folder <ChevronDown className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
            {folderMenuOpen && (
              <div
                className="absolute top-full mt-1 left-0 rounded-xl overflow-hidden py-1 min-w-[180px]"
                style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                <button
                  type="button"
                  onClick={() => { bulkMoveToFolder(null); closeAll() }}
                  className="w-full text-left px-4 py-2 text-fluid-sm transition-colors hover:bg-white/5"
                  style={{ color: '#6B6560' }}
                >
                  No folder (remove)
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { bulkMoveToFolder(f.id); closeAll() }}
                    className="w-full text-left px-4 py-2 text-fluid-sm transition-colors hover:bg-white/5"
                    style={{ color: 'var(--neutral-50)' }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add tag */}
        {tags.length > 0 && (
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => { setAddTagMenuOpen((v) => !v); setFolderMenuOpen(false); setRemoveTagMenuOpen(false) }}
              className="flex items-center gap-1 text-fluid-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.08)', border: '1px solid rgba(226,192,99,0.25)', color: 'var(--contigo-primary)' }}
            >
              Add tag <ChevronDown className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
            {addTagMenuOpen && (
              <div
                className="absolute top-full mt-1 left-0 rounded-xl overflow-hidden py-1 min-w-[160px]"
                style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { bulkAddTag(t.name); closeAll() }}
                    className="w-full text-left px-4 py-2 text-fluid-sm transition-colors hover:bg-white/5 flex items-center gap-2"
                    style={{ color: 'var(--neutral-50)' }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remove tag */}
        {tags.length > 0 && (
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => { setRemoveTagMenuOpen((v) => !v); setFolderMenuOpen(false); setAddTagMenuOpen(false) }}
              className="flex items-center gap-1 text-fluid-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: 'rgba(226,192,99,0.05)', border: '1px solid rgba(226,192,99,0.15)', color: 'var(--neutral-600)' }}
            >
              Remove tag <ChevronDown className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
            {removeTagMenuOpen && (
              <div
                className="absolute top-full mt-1 left-0 rounded-xl overflow-hidden py-1 min-w-[160px]"
                style={{ backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { bulkRemoveTag(t.name); closeAll() }}
                    className="w-full text-left px-4 py-2 text-fluid-sm transition-colors hover:bg-white/5 flex items-center gap-2"
                    style={{ color: 'var(--neutral-50)' }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={handleBulkDelete}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ backgroundColor: 'rgba(232,112,112,0.1)', border: '1px solid rgba(232,112,112,0.2)', color: '#e87070' }}
        >
          Delete
        </button>

        {/* Clear */}
        <button
          type="button"
          onClick={clearSelection}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--neutral-600)' }}
          title="Clear selection"
        >
          <X className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
        </button>
      </div>
    </>
  )
}

// ─── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenuState {
  item: MediaObject
  x: number
  y: number
}

type FlyoutKind = 'folder' | 'tag' | null

function ContextMenu({
  state,
  onClose,
  onAssign,
}: {
  state: ContextMenuState
  onClose: () => void
  onAssign: (item: MediaObject) => void
}) {
  const { folders, tags, moveToFolder, openDetail, deleteItem, updateMetadata } = useMediaLibrary()
  const [openFlyout, setOpenFlyout] = useState<FlyoutKind>(null)
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null)

  const folderBtnRef = useRef<HTMLButtonElement>(null)
  const tagBtnRef = useRef<HTMLButtonElement>(null)

  const openFlyoutAt = (kind: Exclude<FlyoutKind, null>, btnRef: React.RefObject<HTMLButtonElement | null>) => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const FLYOUT_WIDTH = 180
    let left = rect.right
    if (left + FLYOUT_WIDTH > window.innerWidth) {
      left = rect.left - FLYOUT_WIDTH
    }
    setFlyoutPos({ top: rect.top, left })
    setOpenFlyout(kind)
  }

  const itemTags = state.item.metadata?.tags ?? []

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl overflow-hidden py-1 min-w-[180px]"
        style={{
          top: state.y, left: state.x,
          backgroundColor: 'var(--petrol-800)',
          border: '1px solid rgba(226,192,99,0.2)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}
      >
        <MenuItem onClick={() => { openDetail(state.item); onClose() }}>View details</MenuItem>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <button
          ref={folderBtnRef}
          type="button"
          onClick={() => openFlyoutAt('folder', folderBtnRef)}
          className="w-full text-left px-4 py-2 text-fluid-sm flex items-center justify-between transition-colors hover:bg-white/5"
          style={{ color: 'var(--neutral-50)' }}
        >
          <span>Move to folder</span>
          <span style={{ color: 'var(--neutral-600)', fontSize: 10 }}>▶</span>
        </button>

        <button
          ref={tagBtnRef}
          type="button"
          onClick={() => openFlyoutAt('tag', tagBtnRef)}
          className="w-full text-left px-4 py-2 text-fluid-sm flex items-center justify-between transition-colors hover:bg-white/5"
          style={{ color: 'var(--neutral-50)' }}
        >
          <span>Assign Tag</span>
          <span style={{ color: 'var(--neutral-600)', fontSize: 10 }}>▶</span>
        </button>

        <MenuItem onClick={() => { onAssign(state.item); onClose() }}>Assign Media</MenuItem>

        <div style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} className="my-1" />

        <MenuItem
          danger
          onClick={() => {
            if (confirm(`Delete "${state.item.key.split('/').pop()}"?`)) {
              deleteItem(state.item.key)
            }
            onClose()
          }}
        >
          Delete
        </MenuItem>
      </div>

      {/* Flyouts are rendered as fixed-positioned siblings (not nested inside
          the menu box above) because that box has overflow-hidden for its
          rounded corners, which previously clipped a nested absolute submenu. */}
      {openFlyout === 'folder' && flyoutPos && (
        <div
          className="fixed z-[55] rounded-xl overflow-hidden py-1 min-w-[160px]"
          style={{ top: flyoutPos.top, left: flyoutPos.left, backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem dimmed onClick={() => { moveToFolder(state.item.key, null); onClose() }}>
            No folder
          </MenuItem>
          {folders.map((f) => (
            <MenuItem key={f.id} onClick={() => { moveToFolder(state.item.key, f.id); onClose() }}>
              {f.name}
            </MenuItem>
          ))}
        </div>
      )}

      {openFlyout === 'tag' && flyoutPos && (
        <div
          className="fixed z-[55] rounded-xl overflow-hidden py-1 min-w-[180px]"
          style={{ top: flyoutPos.top, left: flyoutPos.left, backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {tags.map((t) => {
            const active = itemTags.includes(t.name)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const next = active ? itemTags.filter((n) => n !== t.name) : [...itemTags, t.name]
                  updateMetadata(state.item.key, { tags: next })
                  // Intentionally do NOT close the menu — user may toggle several tags.
                }}
                className="w-full text-left px-4 py-2 text-fluid-sm flex items-center gap-2 transition-colors hover:bg-white/5"
                style={{ color: 'var(--neutral-50)' }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <span className="flex-1">{t.name}</span>
                {active && <Check className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

function MenuItem({
  children, onClick, danger, dimmed, rightArrow,
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
      className="w-full text-left px-4 py-2 text-fluid-sm flex items-center justify-between transition-colors hover:bg-white/5"
      style={{ color: danger ? '#e87070' : dimmed ? '#6B6560' : 'var(--neutral-50)' }}
    >
      <span>{children}</span>
      {rightArrow && <span style={{ color: 'var(--neutral-600)', fontSize: 10 }}>▶</span>}
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
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-fluid-sm transition-all duration-150"
      style={{
        backgroundColor: isOver ? 'rgba(226,192,99,0.18)' : 'rgba(226,192,99,0.04)',
        border: isOver ? '1.5px solid var(--contigo-primary)' : '1px solid rgba(226,192,99,0.12)',
        transform: isOver ? 'scale(1.03)' : 'scale(1)',
        color: isOver ? 'var(--contigo-primary)' : 'var(--neutral-600)',
      }}
    >
      {isOver ? <FolderOpen className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" /> : <Folder className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />}
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
      <p className="text-[9px] uppercase tracking-widest px-1 pb-1" style={{ color: 'var(--neutral-600)' }}>
        Drop into folder
      </p>
      <DroppableFolderTarget folderId="unfiled" label="No folder" />
      {folders.map((f) => (
        <DroppableFolderTarget key={f.id} folderId={f.id} label={f.name} />
      ))}
    </div>
  )
}

// ─── Main MediaGrid ───────────────────────────────────────────────────────────

export function MediaGrid() {
  const {
    filteredItems, loading, tags,
    openDetail, deleteItem, moveToFolder,
    selectedKeys, toggleSelectKey,
  } = useMediaLibrary()

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [assignItem, setAssignItem] = useState<MediaObject | null>(null)
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null)
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)

  const isSelecting = selectedKeys.length > 0

  // Reset pagination when filtered set changes
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE)
  }, [filteredItems.length])

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
      if (!confirm(`Delete "${key.split('/').pop()}"?`)) return
      await deleteItem(key)
    },
    [deleteItem]
  )

  const displayedItems = filteredItems.slice(0, displayLimit)
  const hasMore = filteredItems.length > displayLimit

  const isEmpty = !loading && filteredItems.length === 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 min-w-0">
        {/* Bulk action bar */}
        {isSelecting && <BulkActionBar />}

        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
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
            style={{ border: '1px dashed rgba(226,192,99,0.2)', color: 'var(--neutral-600)' }}
          >
            <LayoutGrid className="w-[clamp(1.75rem,3.5vw,2.25rem)] h-[clamp(1.75rem,3.5vw,2.25rem)] mb-3 opacity-40" />
            <p className="text-fluid-sm">No media matches the current filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
              {displayedItems.map((item) => (
                <MediaCard
                  key={item.key}
                  item={item}
                  tags={tags}
                  isSelected={selectedKeys.includes(item.key)}
                  isSelecting={isSelecting}
                  onToggleSelect={() => toggleSelectKey(item.key)}
                  onOpenDetail={() => openDetail(item)}
                  onDelete={() => handleDelete(item.key)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  isDragging={activeDragKey === item.key}
                />
              ))}
            </div>

            {/* Load more + count */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-fluid-xs" style={{ color: '#6B6560' }}>
                Showing {displayedItems.length} of {filteredItems.length}
              </p>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setDisplayLimit((v) => v + PAGE_SIZE)}
                  className="px-5 py-2 rounded-xl text-fluid-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'rgba(226,192,99,0.08)',
                    border: '1px solid rgba(226,192,99,0.25)',
                    color: 'var(--contigo-primary)',
                  }}
                >
                  Load more ({filteredItems.length - displayLimit} remaining)
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <DragOverlay>
        {activeDragItem && (
          <MediaCard
            item={activeDragItem}
            tags={tags}
            isSelected={false}
            isSelecting={false}
            onToggleSelect={() => {}}
            onOpenDetail={() => {}}
            onDelete={() => {}}
            onContextMenu={() => {}}
            isMini
          />
        )}
      </DragOverlay>

      {activeDragKey && <FloatingFolderTargets />}

      {contextMenu && (
        <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} onAssign={setAssignItem} />
      )}

      {assignItem && (
        <AssignToEntityModal
          item={assignItem}
          onClose={() => setAssignItem(null)}
          onAssigned={() => setAssignItem(null)}
        />
      )}
    </DndContext>
  )
}
