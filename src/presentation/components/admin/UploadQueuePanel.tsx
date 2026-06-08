'use client'

import { useState } from 'react'
import {
  X, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Film, Image as ImageIcon, Upload,
} from 'lucide-react'
import type { QueueItem, UploadStatus } from './useUploadQueue'

interface Props {
  queue: QueueItem[]
  stats: { uploading: number; pending: number; done: number; errors: number; duplicates: number; total: number }
  isActive: boolean
  onCancel: (id: string) => void
  onCancelAll: () => void
  onForceUpload: (id: string) => void
  onSkip: (id: string) => void
  onRemove: (id: string) => void
  onClearCompleted: () => void
  onClose: () => void
  onAddMore: (files: File[]) => void
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === 'uploading') return <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: '#E2C063' }} />
  if (status === 'done') return <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: '#52B788' }} />
  if (status === 'error') return <XCircle size={14} className="flex-shrink-0" style={{ color: '#e87070' }} />
  if (status === 'duplicate') return <AlertTriangle size={14} className="flex-shrink-0" style={{ color: '#F4A261' }} />
  if (status === 'skipped') return <X size={14} className="flex-shrink-0" style={{ color: '#6B6560' }} />
  // pending
  return (
    <div className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgba(226,192,99,0.3)' }} />
  )
}

function StatusLabel({ status }: { status: UploadStatus }) {
  const labels: Record<UploadStatus, { text: string; color: string }> = {
    pending:   { text: 'Pending',   color: '#A89E8C' },
    uploading: { text: 'Uploading', color: '#E2C063' },
    done:      { text: 'Done',      color: '#52B788' },
    error:     { text: 'Failed',    color: '#e87070' },
    skipped:   { text: 'Skipped',   color: '#6B6560' },
    duplicate: { text: 'Duplicate', color: '#F4A261' },
  }
  const { text, color } = labels[status]
  return <span className="text-[10px] font-medium" style={{ color }}>{text}</span>
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function FileRow({
  item,
  onCancel,
  onForceUpload,
  onSkip,
  onRemove,
}: {
  item: QueueItem
  onCancel: () => void
  onForceUpload: () => void
  onSkip: () => void
  onRemove: () => void
}) {
  const isImage = item.file.type.startsWith('image/')
  const canCancel = item.status === 'pending' || item.status === 'uploading'
  const isDone = item.status === 'done' || item.status === 'skipped'

  const progressColor = item.status === 'error'
    ? '#e87070'
    : item.status === 'done'
    ? '#52B788'
    : '#E2C063'

  return (
    <div
      className="flex gap-2.5 p-3"
      style={{ borderBottom: '1px solid rgba(226,192,99,0.06)' }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ width: 52, height: 40, backgroundColor: 'rgba(226,192,99,0.06)' }}
      >
        {item.previewUrl ? (
          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
        ) : isImage ? (
          <ImageIcon size={18} style={{ color: '#6B6560' }} />
        ) : (
          <Film size={18} style={{ color: '#6B6560' }} />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Filename + status */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs truncate font-medium" style={{ color: '#E8DCC4', maxWidth: 200 }}>
            {item.file.name}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusIcon status={item.status} />
            <StatusLabel status={item.status} />
          </div>
        </div>

        {/* File size */}
        <p className="text-[10px]" style={{ color: '#6B6560' }}>{formatBytes(item.file.size)}</p>

        {/* Progress bar */}
        {(item.status === 'uploading' || item.status === 'done') && (
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(226,192,99,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%`, backgroundColor: progressColor }}
            />
          </div>
        )}

        {/* Duplicate warning */}
        {item.status === 'duplicate' && item.duplicateOf && (
          <div className="space-y-1.5">
            <p className="text-[10px]" style={{ color: '#F4A261' }}>
              Similar to: <span className="font-mono">{item.duplicateOf}</span>
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onForceUpload}
                className="text-[10px] px-2 py-0.5 rounded font-medium transition-colors"
                style={{ backgroundColor: 'rgba(226,192,99,0.12)', color: '#E2C063', border: '1px solid rgba(226,192,99,0.25)' }}
              >
                Upload anyway
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="text-[10px] px-2 py-0.5 rounded font-medium transition-colors"
                style={{ color: '#6B6560', border: '1px solid rgba(107,101,96,0.25)' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {item.status === 'error' && item.error && (
          <p className="text-[10px]" style={{ color: '#e87070' }}>{item.error}</p>
        )}
      </div>

      {/* Action button */}
      <div className="flex-shrink-0 flex items-start pt-0.5">
        {canCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: '#6B6560' }}
            title="Cancel"
          >
            <X size={13} />
          </button>
        ) : isDone ? (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: '#6B6560' }}
            title="Dismiss"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function UploadQueuePanel({
  queue, stats, isActive,
  onCancel, onCancelAll, onForceUpload, onSkip, onRemove,
  onClearCompleted, onClose, onAddMore,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const allSettled = !isActive && stats.duplicates === 0
  const canClose = !isActive

  // Header status text
  let statusText = ''
  if (stats.uploading > 0 || stats.pending > 0) {
    const active = stats.uploading + stats.pending
    statusText = `Uploading ${stats.done + stats.uploading} of ${stats.total - stats.duplicates - stats.errors} files`
  } else if (stats.duplicates > 0 && stats.total === stats.duplicates + stats.done + stats.errors) {
    statusText = `${stats.duplicates} file${stats.duplicates !== 1 ? 's' : ''} need review`
  } else if (stats.errors > 0) {
    statusText = `${stats.done} uploaded · ${stats.errors} failed`
  } else if (stats.done > 0) {
    statusText = `${stats.done} file${stats.done !== 1 ? 's' : ''} uploaded`
  }

  // Progress of the whole queue
  const overallPct = stats.total > 0
    ? Math.round(((stats.done + stats.errors) / (stats.total - stats.duplicates)) * 100)
    : 0

  function handleAddMore() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.multiple = true
    input.onchange = () => {
      if (input.files) onAddMore(Array.from(input.files))
    }
    input.click()
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-2xl overflow-hidden flex flex-col"
      style={{
        width: 400,
        maxHeight: collapsed ? 'auto' : '70vh',
        backgroundColor: '#16120E',
        border: '1px solid rgba(226,192,99,0.2)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none flex-shrink-0"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(226,192,99,0.08)' }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <Upload size={14} style={{ color: '#E2C063', flexShrink: 0 }} />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: '#E2C063' }}>Upload Queue</p>
          {statusText && (
            <p className="text-[10px] truncate" style={{ color: '#A89E8C' }}>{statusText}</p>
          )}
        </div>

        {/* Overall progress bar (thin strip at bottom of header) */}
        {isActive && (
          <div className="w-12 h-1 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(226,192,99,0.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, backgroundColor: '#E2C063' }}
            />
          </div>
        )}

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {allSettled && stats.done > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-[10px] px-2 py-0.5 rounded transition-colors"
              style={{ color: '#6B6560', border: '1px solid rgba(107,101,96,0.25)' }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: '#A89E8C' }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded transition-colors hover:bg-white/5"
              style={{ color: '#6B6560' }}
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      {!collapsed && (
        <>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {queue.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                onCancel={() => onCancel(item.id)}
                onForceUpload={() => onForceUpload(item.id)}
                onSkip={() => onSkip(item.id)}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </div>

          {/* Footer toolbar */}
          <div
            className="flex items-center justify-between gap-2 px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(226,192,99,0.08)' }}
          >
            <button
              type="button"
              onClick={handleAddMore}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ color: '#E2C063', border: '1px solid rgba(226,192,99,0.25)', backgroundColor: 'rgba(226,192,99,0.06)' }}
            >
              <Upload size={12} />
              Add more
            </button>

            <div className="flex items-center gap-2">
              {(stats.done > 0 || stats.errors > 0) && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#6B6560' }}
                >
                  Clear done
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  onClick={onCancelAll}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: '#e87070', border: '1px solid rgba(232,112,112,0.2)', backgroundColor: 'rgba(232,112,112,0.06)' }}
                >
                  Cancel all
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
