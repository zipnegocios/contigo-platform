'use client'

import { useState, useRef, useEffect } from 'react'
import { extractMediaMetadata } from '@/presentation/lib/extractMediaMetadata'
import type { MediaObject } from './MediaLibraryContext'

const MAX_CONCURRENT = 3

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'skipped' | 'duplicate'

export interface QueueItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  duplicateOf?: string   // basename of suspected duplicate in library or queue
  previewUrl?: string    // object URL for image thumbnail
  key?: string           // R2 key after upload
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function useUploadQueue(
  existingItems: MediaObject[],
  onFileUploaded: () => void,
  uploadPrefix = 'projects/gallery',
) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const queueRef = useRef<QueueItem[]>([])
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map())
  const uploadPrefixRef = useRef(uploadPrefix)
  useEffect(() => { uploadPrefixRef.current = uploadPrefix }, [uploadPrefix])

  // Keeps ref always in sync; must be used for all state mutations
  function sync(updater: (prev: QueueItem[]) => QueueItem[]) {
    const next = updater(queueRef.current)
    queueRef.current = next
    setQueue([...next])
  }

  function patch(id: string, update: Partial<QueueItem>) {
    sync((prev) => prev.map((i) => (i.id === id ? { ...i, ...update } : i)))
  }

  function findDuplicate(file: File): string | undefined {
    const name = file.name.toLowerCase()
    const size = file.size

    for (const item of existingItems) {
      const base = item.key.split('/').pop()?.toLowerCase() ?? ''
      if (base === name) return base
      // same stem + same size → likely same file with minor change
      if (item.size === size) {
        const baseStem = base.replace(/\.[^.]+$/, '')
        const nameStem = name.replace(/\.[^.]+$/, '')
        if (baseStem === nameStem) return base
      }
    }

    // Also check within current queue (prevent exact duplicate submissions)
    for (const qi of queueRef.current) {
      if (qi.file.name.toLowerCase() === name && qi.status !== 'skipped') {
        return qi.file.name
      }
    }

    return undefined
  }

  async function startUpload(item: QueueItem) {
    patch(item.id, { status: 'uploading', progress: 0 })

    try {
      // 1. Get presigned PUT URL
      const presignRes = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: uploadPrefixRef.current,
          filename: item.file.name,
          contentType: item.file.type,
        }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { presignedUrl, key } = await presignRes.json()

      // 2. PUT directly to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrsRef.current.set(item.id, xhr)

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            patch(item.id, { progress: Math.round((e.loaded / e.total) * 100) })
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`HTTP ${xhr.status}`))
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Cancelled')))

        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', item.file.type)
        xhr.send(item.file)
      })

      xhrsRef.current.delete(item.id)

      // 3. Save metadata (dimensions, duration, format)
      const meta = await extractMediaMetadata(item.file)
      if (Object.keys(meta).length > 0) {
        await fetch('/api/admin/media/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, ...meta }),
        })
      }

      patch(item.id, { status: 'done', progress: 100, key })
      onFileUploaded()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      const isCancelled = msg === 'Cancelled'
      patch(item.id, {
        status: isCancelled ? 'skipped' : 'error',
        progress: 0,
        error: isCancelled ? undefined : msg,
      })
      xhrsRef.current.delete(item.id)
    }

    startNextPending()
  }

  function startNextPending() {
    const uploadingCount = queueRef.current.filter((i) => i.status === 'uploading').length
    const slots = MAX_CONCURRENT - uploadingCount
    if (slots <= 0) return
    const pending = queueRef.current.filter((i) => i.status === 'pending')
    pending.slice(0, slots).forEach((item) => startUpload(item))
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function addFiles(files: File[]) {
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!valid.length) return

    const newItems: QueueItem[] = valid.map((file) => {
      const dupOf = findDuplicate(file)
      return {
        id: makeId(),
        file,
        status: dupOf ? 'duplicate' : 'pending',
        progress: 0,
        duplicateOf: dupOf,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }
    })

    sync((prev) => [...prev, ...newItems])

    // Start uploading non-duplicate items within available slots
    const uploadingCount = queueRef.current.filter((i) => i.status === 'uploading').length
    const slots = MAX_CONCURRENT - uploadingCount
    newItems
      .filter((i) => i.status === 'pending')
      .slice(0, slots)
      .forEach((item) => startUpload(item))
  }

  function cancelItem(id: string) {
    const xhr = xhrsRef.current.get(id)
    if (xhr) xhr.abort()
    else patch(id, { status: 'skipped', progress: 0 })
  }

  function cancelAll() {
    queueRef.current
      .filter((i) => i.status === 'pending' || i.status === 'uploading' || i.status === 'duplicate')
      .forEach((i) => {
        const xhr = xhrsRef.current.get(i.id)
        if (xhr) xhr.abort()
      })
    sync((prev) =>
      prev.map((i) =>
        i.status === 'pending' || i.status === 'uploading' || i.status === 'duplicate'
          ? { ...i, status: 'skipped', progress: 0 }
          : i
      )
    )
  }

  function forceUpload(id: string) {
    const item = queueRef.current.find((i) => i.id === id)
    if (!item) return
    const updated = { ...item, status: 'pending' as const, duplicateOf: undefined }
    patch(id, { status: 'pending', duplicateOf: undefined })
    const uploadingCount = queueRef.current.filter((i) => i.status === 'uploading').length
    if (uploadingCount < MAX_CONCURRENT) {
      startUpload(updated)
    }
  }

  function skipItem(id: string) {
    const item = queueRef.current.find((i) => i.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    patch(id, { status: 'skipped', progress: 0 })
  }

  function removeItem(id: string) {
    const item = queueRef.current.find((i) => i.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    const xhr = xhrsRef.current.get(id)
    if (xhr) xhr.abort()
    xhrsRef.current.delete(id)
    sync((prev) => prev.filter((i) => i.id !== id))
  }

  function clearCompleted() {
    queueRef.current
      .filter((i) => i.status === 'done' || i.status === 'skipped' || i.status === 'error')
      .forEach((i) => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl) })
    sync((prev) => prev.filter((i) => i.status !== 'done' && i.status !== 'skipped' && i.status !== 'error'))
  }

  function clearAll() {
    queueRef.current.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl)
      const xhr = xhrsRef.current.get(i.id)
      if (xhr) xhr.abort()
    })
    xhrsRef.current.clear()
    sync(() => [])
  }

  const uploading = queue.filter((i) => i.status === 'uploading').length
  const pending = queue.filter((i) => i.status === 'pending').length
  const done = queue.filter((i) => i.status === 'done').length
  const errors = queue.filter((i) => i.status === 'error').length
  const duplicates = queue.filter((i) => i.status === 'duplicate').length
  const isActive = uploading > 0 || pending > 0

  return {
    queue,
    addFiles,
    cancelItem,
    cancelAll,
    forceUpload,
    skipItem,
    removeItem,
    clearCompleted,
    clearAll,
    stats: { uploading, pending, done, errors, duplicates, total: queue.length },
    isActive,
  }
}
