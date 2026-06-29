'use client'

import { Film, Image, Info, Trash2, Check, Zap, ZapOff } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { MediaTag } from '@/types/media'
import type { MediaObject } from './MediaLibraryContext'

interface MediaCardProps {
  item: MediaObject
  tags: MediaTag[]
  isSelected: boolean
  isSelecting: boolean
  onToggleSelect: () => void
  onOpenDetail: () => void
  onDelete: () => void
  onContextMenu: (e: React.MouseEvent) => void
  isDragging?: boolean
  isMini?: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function MediaCard({
  item,
  tags,
  isSelected,
  isSelecting,
  onToggleSelect,
  onOpenDetail,
  onDelete,
  onContextMenu,
  isDragging = false,
  isMini = false,
}: MediaCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.key,
    data: { key: item.key, mediaType: item.mediaType, publicUrl: item.publicUrl },
    disabled: isSelecting,
  })

  const itemTags = (item.metadata?.tags ?? [])
    .map((name) => tags.find((t) => t.name === name))
    .filter(Boolean) as MediaTag[]

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  if (isMini) {
    return (
      <div
        className="rounded-xl overflow-hidden shadow-lg"
        style={{ width: 'clamp(6rem,12vw,9rem)', aspectRatio: '4/3', backgroundColor: 'var(--petrol-800)', border: '1px solid rgba(226,192,99,0.4)' }}
      >
        {item.mediaType === 'image' ? (
          <img src={item.publicUrl} alt="" className="w-full h-full object-cover" />
        ) : item.mediaType === 'video' ? (
          <video src={item.publicUrl} className="w-full h-full object-cover" muted preload="metadata" style={{ pointerEvents: 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-[clamp(1.25rem,2.5vw,1.5rem)] h-[clamp(1.25rem,2.5vw,1.5rem)]" style={{ color: 'var(--neutral-600)' }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: 'var(--petrol-800)',
        border: isSelected
          ? '2px solid var(--contigo-primary)'
          : isDragging
          ? '1.5px dashed rgba(226,192,99,0.5)'
          : '1px solid rgba(226,192,99,0.1)',
      }}
      className="group relative rounded-xl overflow-hidden transition-opacity"
      onContextMenu={onContextMenu}
    >
      {/* Drag handle — disabled in selection mode */}
      {!isSelecting && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 z-10"
          style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      )}

      {/* Selection overlay — clicking anywhere in the card selects when in selection mode */}
      {isSelecting && (
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={onToggleSelect}
        />
      )}

      <div style={{ aspectRatio: '4/3' }}>
        {item.mediaType === 'video' ? (
          <video
            src={item.publicUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            style={{ pointerEvents: 'none' }}
          />
        ) : item.mediaType === 'image' ? (
          <img src={item.publicUrl} alt={item.key} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-[clamp(1.5rem,3vw,1.75rem)] h-[clamp(1.5rem,3vw,1.75rem)]" style={{ color: 'var(--neutral-600)' }} />
          </div>
        )}

        {/* Video badge */}
        {item.mediaType === 'video' && (
          <span
            className="absolute top-2 left-2 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded z-20"
            style={{ backgroundColor: 'rgba(226,192,99,0.2)', color: 'var(--contigo-primary)', pointerEvents: 'none' }}
          >
            Video
          </span>
        )}

        {/* Duration badge for videos */}
        {item.mediaType === 'video' && item.metadata?.duration != null && (
          <span
            className="absolute bottom-8 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full z-20"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--neutral-50)', pointerEvents: 'none' }}
          >
            {Math.floor(item.metadata.duration / 60)}:{String(item.metadata.duration % 60).padStart(2, '0')}
          </span>
        )}

        {/* Optimized (WebP) badge — images only */}
        {item.mediaType === 'image' && (
          <span
            className="absolute bottom-2 left-2 p-1 rounded-full z-20"
            style={{
              backgroundColor: item.metadata?.optimized ? 'rgba(226,192,99,0.9)' : 'rgba(22,18,14,0.55)',
              pointerEvents: 'none',
            }}
            title={item.metadata?.optimized ? 'Optimized (WebP)' : 'Not optimized'}
          >
            {item.metadata?.optimized ? (
              <Zap
                className="w-[clamp(0.65rem,1.3vw,0.8rem)] h-[clamp(0.65rem,1.3vw,0.8rem)]"
                style={{ color: 'var(--petrol-800)' }}
                fill="var(--petrol-800)"
              />
            ) : (
              <ZapOff className="w-[clamp(0.65rem,1.3vw,0.8rem)] h-[clamp(0.65rem,1.3vw,0.8rem)]" style={{ color: 'var(--neutral-600)' }} />
            )}
          </span>
        )}

        {/* Checkbox — visible when selected, or when any item is selected (isSelecting), or on hover */}
        <div
          className={`absolute top-2 left-2 z-20 transition-opacity ${isSelected || isSelecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: isSelected ? 'var(--contigo-primary)' : 'rgba(22,18,14,0.75)',
              border: isSelected ? 'none' : '1.5px solid rgba(226,192,99,0.7)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {isSelected && <Check className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" strokeWidth={3} style={{ color: 'var(--petrol-800)' }} />}
          </div>
        </div>

        {/* Action buttons (hidden in selection mode) */}
        {!isSelecting && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenDetail() }}
              className="p-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(226,192,99,0.18)', color: 'var(--contigo-primary)' }}
              title="Details"
            >
              <Info className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(232,112,112,0.18)', color: '#e87070' }}
              title="Delete"
            >
              <Trash2 className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)]" />
            </button>
          </div>
        )}

        {/* Bottom info overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
          style={{ background: 'linear-gradient(to top, rgba(30,26,22,0.92) 0%, transparent 55%)', pointerEvents: 'none' }}
        >
          <p className="text-[10px] truncate mb-0.5" style={{ color: 'var(--neutral-50)' }}>{item.key.split('/').pop()}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px]" style={{ color: 'var(--neutral-600)' }}>{formatBytes(item.size)}</p>
            {item.metadata?.width != null && (
              <p className="text-[10px]" style={{ color: '#6B6560' }}>
                {item.metadata.width}×{item.metadata.height}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tag chips */}
      {itemTags.length > 0 && (
        <div className="px-2 py-1.5 flex flex-wrap gap-1 relative z-20">
          {itemTags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${t.color}18`, color: t.color, border: `1px solid ${t.color}33` }}
            >
              {t.name}
            </span>
          ))}
          {itemTags.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: 'var(--neutral-600)' }}>
              +{itemTags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
