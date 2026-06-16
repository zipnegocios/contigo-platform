'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Folder, FolderOpen, Plus, X, Check, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { useMediaLibrary } from './MediaLibraryContext'

const TAG_COLORS = [
  'var(--contigo-primary)', '#7EC8A4', '#7EB8E2', '#E27E7E', '#C27EE2',
  '#E2A87E', '#7EE2D4', '#A8E27E',
]

// ─── Droppable folder row ─────────────────────────────────────────────────────

function DroppableFolderRow({
  folderId,
  label,
  count,
  active,
  onClick,
  onDelete,
  onRename,
}: {
  folderId: string
  label: string
  count: number
  active: boolean
  onClick: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `sidebar-folder-${folderId}`,
    data: { folderId: folderId === 'unfiled' || folderId === 'all' ? null : folderId },
  })
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(label)

  const handleRename = () => {
    if (editVal.trim() && editVal !== label) onRename?.(editVal.trim())
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-0.5">
      <div
        ref={setNodeRef}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl text-left transition-all duration-150 min-w-0 cursor-pointer"
        style={{
          backgroundColor: isOver
            ? 'rgba(226,192,99,0.22)'
            : active
            ? 'rgba(226,192,99,0.15)'
            : 'transparent',
          border: isOver
            ? '1.5px solid #E2C063'
            : '1.5px solid transparent',
          transform: isOver ? 'scale(1.02)' : 'scale(1)',
        }}
        onClick={!editing ? onClick : undefined}
      >
        <span className="flex-shrink-0" style={{ color: active || isOver ? 'var(--contigo-primary)' : 'var(--neutral-600)' }}>
          {active || isOver ? <FolderOpen size={13} /> : <Folder size={13} />}
        </span>

        {editing ? (
          <input
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            onBlur={handleRename}
            className="flex-1 text-xs bg-transparent outline-none border-b min-w-0"
            style={{ color: 'var(--neutral-50)', borderColor: 'rgba(226,192,99,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs font-medium truncate flex-1"
            style={{ color: active ? 'var(--contigo-primary)' : 'var(--neutral-600)' }}
            onDoubleClick={() => onRename && setEditing(true)}
          >
            {label}
          </span>
        )}

        <span
          className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: active ? 'rgba(226,192,99,0.2)' : 'rgba(107,101,96,0.15)',
            color: active ? 'var(--contigo-primary)' : 'var(--neutral-600)',
          }}
        >
          {count}
        </span>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded flex-shrink-0 transition-opacity"
          style={{ color: '#e87070' }}
          title="Delete folder"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function MediaBankSidebar() {
  const {
    items,
    folders,
    tags,
    activeFolderId,
    setActiveFolderId,
    selectedTagNames,
    toggleTag,
    createFolder,
    deleteFolder,
    renameFolder,
    createTag,
    deleteTag,
  } = useMediaLibrary()

  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [tagsExpanded, setTagsExpanded] = useState(true)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  const unfiledCount = items.filter((i) => !i.metadata?.folderId).length

  const submitFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setCreatingFolder(false)
  }

  const submitTag = async () => {
    if (!newTagName.trim()) return
    await createTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setCreatingTag(false)
  }

  return (
    <aside
      className="flex-shrink-0 rounded-2xl p-3 space-y-1 overflow-y-auto"
      style={{
        width: 230,
        backgroundColor: 'rgba(226,192,99,0.03)',
        border: '1px solid rgba(226,192,99,0.1)',
        maxHeight: '70vh',
      }}
    >
      {/* FOLDERS */}
      <button
        type="button"
        onClick={() => setFoldersExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: 'var(--neutral-600)' }}
      >
        {foldersExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Folders
      </button>

      {foldersExpanded && (
        <>
          <DroppableFolderRow
            folderId="all"
            label="All"
            count={items.length}
            active={activeFolderId === null}
            onClick={() => setActiveFolderId(null)}
          />
          <DroppableFolderRow
            folderId="unfiled"
            label="No folder"
            count={unfiledCount}
            active={activeFolderId === 'unfiled'}
            onClick={() => setActiveFolderId('unfiled')}
          />

          {folders.map((f) => (
            <DroppableFolderRow
              key={f.id}
              folderId={f.id}
              label={f.name}
              count={items.filter((i) => i.metadata?.folderId === f.id).length}
              active={activeFolderId === f.id}
              onClick={() => setActiveFolderId(f.id)}
              onDelete={() => {
                if (confirm(`Delete folder "${f.name}"?`)) deleteFolder(f.id)
              }}
              onRename={(name) => renameFolder(f.id, name)}
            />
          ))}

          {creatingFolder ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitFolder()
                  if (e.key === 'Escape') setCreatingFolder(false)
                }}
                placeholder="Folder name…"
                className="flex-1 text-xs px-2 py-1 rounded outline-none min-w-0"
                style={{
                  backgroundColor: 'rgba(226,192,99,0.1)',
                  color: 'var(--neutral-50)',
                  border: '1px solid rgba(226,192,99,0.25)',
                }}
              />
              <button onClick={submitFolder} className="p-1 rounded" style={{ color: 'var(--contigo-primary)' }}>
                <Check size={12} />
              </button>
              <button onClick={() => setCreatingFolder(false)} className="p-1 rounded" style={{ color: 'var(--neutral-600)' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingFolder(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ color: '#6B6560' }}
            >
              <Plus size={12} /> New folder
            </button>
          )}
        </>
      )}

      <div className="my-2" style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }} />

      {/* TAGS */}
      <button
        type="button"
        onClick={() => setTagsExpanded((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: 'var(--neutral-600)' }}
      >
        {tagsExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Tags
      </button>

      {tagsExpanded && (
        <>
          <div className="px-2 py-1 flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const active = selectedTagNames.includes(t.name)
              const count = items.filter((i) => i.metadata?.tags?.includes(t.name)).length
              return (
                <div key={t.id} className="group/tag flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                    style={{
                      backgroundColor: active ? `${t.color}22` : 'rgba(107,101,96,0.12)',
                      border: `1px solid ${active ? t.color : 'rgba(107,101,96,0.25)'}`,
                      color: active ? t.color : 'var(--neutral-600)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name} ({count})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete tag "${t.name}"?`)) deleteTag(t.id)
                    }}
                    className="opacity-0 group-hover/tag:opacity-100 p-0.5 rounded transition-opacity"
                    style={{ color: '#e87070' }}
                  >
                    <X size={9} />
                  </button>
                </div>
              )
            })}
          </div>

          {creatingTag ? (
            <div className="px-2 py-1 space-y-2">
              <input
                autoFocus
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitTag()
                  if (e.key === 'Escape') setCreatingTag(false)
                }}
                placeholder="Tag name…"
                className="w-full text-xs px-2 py-1 rounded outline-none"
                style={{
                  backgroundColor: 'rgba(226,192,99,0.1)',
                  color: 'var(--neutral-50)',
                  border: '1px solid rgba(226,192,99,0.25)',
                }}
              />
              <div className="flex gap-1 flex-wrap">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className="w-5 h-5 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      outline: newTagColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={submitTag}
                  className="flex-1 text-xs py-1 rounded font-medium"
                  style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
                >
                  Create
                </button>
                <button
                  onClick={() => setCreatingTag(false)}
                  className="flex-1 text-xs py-1 rounded"
                  style={{ color: 'var(--neutral-600)', border: '1px solid rgba(107,101,96,0.2)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingTag(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ color: '#6B6560' }}
            >
              <Tag size={12} /> New tag
            </button>
          )}
        </>
      )}
    </aside>
  )
}
