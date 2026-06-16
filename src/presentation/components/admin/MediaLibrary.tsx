'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, UploadCloud } from 'lucide-react'
import { MediaLibraryProvider, useMediaLibrary, type EntityContext } from './MediaLibraryContext'
import { MediaSearchBar } from './MediaSearchBar'
import { MediaGrid } from './MediaGrid'
import { MediaBankSidebar } from './MediaBankSidebar'
import { MediaDetailDrawer } from './MediaDetailDrawer'
import { UploadQueuePanel } from './UploadQueuePanel'
import { useUploadQueue } from './useUploadQueue'

// ─── Tab configuration ────────────────────────────────────────────────────────

const TAB_LIST = [
  { key: 'all', label: 'All' },
  { key: 'projects', label: 'Projects' },
  { key: 'services', label: 'Services' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'bank', label: 'Bank' },
] as const

// ─── Inner orchestrator ───────────────────────────────────────────────────────

function MediaLibraryInner() {
  const { tab, setTab, detailItem, loading, refreshItems, items } = useMediaLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload queue — files go to 'bank' prefix when on Bank tab, otherwise 'projects/gallery'
  const uploadPrefix = tab === 'bank' ? 'bank' : 'projects/gallery'
  const {
    queue, addFiles, cancelItem, cancelAll, forceUpload, skipItem,
    removeItem, clearCompleted, clearAll, stats, isActive,
  } = useUploadQueue(items, refreshItems, uploadPrefix)

  const [queueVisible, setQueueVisible] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Show panel automatically when files are added
  const handleAddFiles = useCallback(
    (files: File[]) => {
      addFiles(files)
      setQueueVisible(true)
    },
    [addFiles]
  )

  // ─── Drag & drop ───────────────────────────────────────────────────────────

  const dragCounter = useRef(0)

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleAddFiles(files)
    },
    [handleAddFiles]
  )

  // ─── File input handler ────────────────────────────────────────────────────

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) handleAddFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      className="relative space-y-4"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-2xl pointer-events-none"
          style={{
            backgroundColor: 'rgba(22,18,14,0.88)',
            border: '2px dashed rgba(226,192,99,0.6)',
          }}
        >
          <UploadCloud size={48} style={{ color: 'var(--contigo-primary)' }} className="mb-3 opacity-90" />
          <p className="text-lg font-semibold" style={{ color: 'var(--contigo-primary)', fontFamily: 'var(--font-cormorant)' }}>
            Drop files to upload
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--neutral-600)' }}>Images and videos supported</p>
        </div>
      )}

      <MediaSearchBar />

      {/* Tabs + Upload button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                tab === t.key
                  ? { backgroundColor: 'rgba(226,192,99,0.18)', color: 'var(--contigo-primary)' }
                  : { color: '#6B6560' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Show queue badge when there are active uploads */}
          {queue.length > 0 && !queueVisible && (
            <button
              type="button"
              onClick={() => setQueueVisible(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: isActive ? 'rgba(226,192,99,0.12)' : 'rgba(82,183,136,0.1)',
                border: isActive ? '1px solid rgba(226,192,99,0.3)' : '1px solid rgba(82,183,136,0.3)',
                color: isActive ? 'var(--contigo-primary)' : '#52B788',
              }}
            >
              {isActive ? (
                <span>{stats.done + stats.uploading} of {stats.total - stats.duplicates} uploading</span>
              ) : (
                <span>{stats.done} uploaded</span>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{ backgroundColor: 'var(--contigo-primary)', color: 'var(--petrol-800)' }}
          >
            <Upload size={15} />
            Upload files
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-5 items-start">
        {tab === 'bank' && !loading && <MediaBankSidebar />}
        <MediaGrid />
        {detailItem && <MediaDetailDrawer />}
      </div>

      {/* Floating upload queue panel */}
      {queueVisible && queue.length > 0 && (
        <UploadQueuePanel
          queue={queue}
          stats={stats}
          isActive={isActive}
          onCancel={cancelItem}
          onCancelAll={cancelAll}
          onForceUpload={forceUpload}
          onSkip={skipItem}
          onRemove={removeItem}
          onClearCompleted={clearCompleted}
          onClose={() => {
            clearAll()
            setQueueVisible(false)
          }}
          onAddMore={(files) => addFiles(files)}
        />
      )}
    </div>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

interface MediaLibraryProps {
  entityContext?: EntityContext | null
}

export function MediaLibrary({ entityContext }: MediaLibraryProps = {}) {
  return (
    <MediaLibraryProvider entityContext={entityContext}>
      <MediaLibraryInner />
    </MediaLibraryProvider>
  )
}
