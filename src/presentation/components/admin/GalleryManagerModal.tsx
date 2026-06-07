'use client'

import { useState, useRef } from 'react'
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
import { X, GripVertical, ChevronUp, ChevronDown, Trash2, Upload, Film, Plus } from 'lucide-react'
import type { GalleryItem } from '@/types/media'
import { MediaPickerModal } from '@/presentation/components/admin/MediaPickerModal'
import { uploadFileToR2 } from '@/presentation/lib/uploadToR2'

interface GalleryManagerModalProps {
  items: GalleryItem[]
  onSave: (items: GalleryItem[]) => void
  onClose: () => void
  folder?: string
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

function SortableItem({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onChangeTitle,
  onChangeDescription,
}: {
  item: GalleryItem & { _id: string }
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onChangeTitle: (v: string) => void
  onChangeDescription: (v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: '#1E1A16', border: '1px solid rgba(226,192,99,0.12)' }}
      className="flex gap-3 p-3 rounded-xl"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 flex items-center self-start mt-1 p-1 rounded"
        style={{ color: '#6B6560', touchAction: 'none' }}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Thumbnail */}
      <div
        className="flex-shrink-0 overflow-hidden rounded-lg"
        style={{ width: 80, height: 60, backgroundColor: '#150F0A' }}
      >
        {isVideo(item.url) ? (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={20} style={{ color: '#A89E8C' }} />
          </div>
        ) : (
          <img src={item.url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Metadata inputs */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          type="text"
          value={item.title || ''}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none"
          style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: '#E8DCC4' }}
        />
        <input
          type="text"
          value={item.description || ''}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none"
          style={{ backgroundColor: 'rgba(226,192,99,0.06)', border: '1px solid rgba(226,192,99,0.12)', color: '#E8DCC4' }}
        />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex flex-col gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded transition-opacity disabled:opacity-20"
          style={{ color: '#A89E8C' }}
          title="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded transition-opacity disabled:opacity-20"
          style={{ color: '#A89E8C' }}
          title="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded transition-colors"
          style={{ color: '#e87070' }}
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

type GalleryItemWithId = GalleryItem & { _id: string }

export function GalleryManagerModal({ items: initialItems, onSave, onClose, folder }: GalleryManagerModalProps) {
  const [localItems, setLocalItems] = useState<GalleryItemWithId[]>(() =>
    initialItems.map((item, i) => ({ ...item, order: i, _id: `item-${i}-${item.url}` }))
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalItems((prev) => {
      const oldIdx = prev.findIndex((i) => i._id === active.id)
      const newIdx = prev.findIndex((i) => i._id === over.id)
      return arrayMove(prev, oldIdx, newIdx).map((item, idx) => ({ ...item, order: idx }))
    })
  }

  function moveItem(index: number, direction: -1 | 1) {
    setLocalItems((prev) => {
      const next = arrayMove(prev, index, index + direction)
      return next.map((item, idx) => ({ ...item, order: idx }))
    })
  }

  function removeItem(id: string) {
    setLocalItems((prev) => prev.filter((i) => i._id !== id).map((item, idx) => ({ ...item, order: idx })))
  }

  function addUrls(urls: string[]) {
    setLocalItems((prev) => {
      const existing = new Set(prev.map((i) => i.url))
      const newItems: GalleryItemWithId[] = urls
        .filter((u) => !existing.has(u))
        .map((url, i) => ({
          url,
          order: prev.length + i,
          _id: `item-${Date.now()}-${i}-${url}`,
        }))
      return [...prev, ...newItems]
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const results = await Promise.all(
        files.map((file) => {
          const prefix = file.type.startsWith('video/') ? 'projects/video' : 'projects/gallery'
          return uploadFileToR2(file, prefix, undefined, folder)
        })
      )
      addUrls(results.map((r) => r.publicUrl))
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleSave() {
    onSave(localItems.map(({ _id: _ignored, ...item }) => item))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative rounded-2xl w-full flex flex-col"
        style={{
          maxWidth: 860,
          maxHeight: '90vh',
          backgroundColor: '#16120E',
          border: '1px solid rgba(226,192,99,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(226,192,99,0.1)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: '#E8DCC4', fontFamily: 'var(--font-cormorant)' }}>
            Gallery Manager
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#A89E8C' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: ordered gallery list */}
          <div
            className="flex-1 min-w-0 overflow-y-auto p-5 space-y-2"
            style={{ borderRight: '1px solid rgba(226,192,99,0.08)' }}
          >
            {localItems.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-40 rounded-xl"
                style={{ border: '1px dashed rgba(226,192,99,0.2)', color: '#A89E8C' }}
              >
                <p className="text-sm">No gallery items yet</p>
                <p className="text-xs mt-1">Add images from the library or upload new files</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localItems.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                  {localItems.map((item, idx) => (
                    <SortableItem
                      key={item._id}
                      item={item}
                      index={idx}
                      total={localItems.length}
                      onMoveUp={() => moveItem(idx, -1)}
                      onMoveDown={() => moveItem(idx, 1)}
                      onRemove={() => removeItem(item._id)}
                      onChangeTitle={(v) =>
                        setLocalItems((prev) =>
                          prev.map((i) => (i._id === item._id ? { ...i, title: v } : i))
                        )
                      }
                      onChangeDescription={(v) =>
                        setLocalItems((prev) =>
                          prev.map((i) => (i._id === item._id ? { ...i, description: v } : i))
                        )
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Right: Add media panel */}
          <div className="flex-shrink-0 p-5 space-y-4" style={{ width: 220 }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#A89E8C' }}>Add Media</p>

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid rgba(226,192,99,0.3)', color: '#E2C063', backgroundColor: 'rgba(226,192,99,0.06)' }}
            >
              <Plus size={15} />
              Browse Library
            </button>

            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
              style={{ border: '1px solid #E5DDD0', color: '#6B6560' }}
            >
              <Upload size={15} />
              {uploading ? 'Uploading…' : 'Upload Files'}
            </button>

            <p className="text-[10px]" style={{ color: '#6B6560' }}>
              Drag rows to reorder, or use ↑↓ buttons. Set title and description for lightbox display.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(226,192,99,0.1)' }}
        >
          <p className="text-sm" style={{ color: '#A89E8C' }}>
            {localItems.length} item{localItems.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid rgba(226,192,99,0.2)', color: '#A89E8C' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
            >
              Save Gallery
            </button>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          addUrls([url])
          setPickerOpen(false)
        }}
        onMultiSelect={(urls) => {
          addUrls(urls)
          setPickerOpen(false)
        }}
        multiSelect={true}
        allowVideo={true}
      />
    </div>
  )
}
