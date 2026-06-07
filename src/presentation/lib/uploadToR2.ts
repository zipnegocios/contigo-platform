'use client'

export interface UploadResult {
  key: string
  publicUrl: string
}

/**
 * Uploads a file directly to R2 via presigned URL.
 * Uses XMLHttpRequest to support upload progress events.
 *
 * @param file - File to upload
 * @param prefix - Storage prefix: 'projects/cover' | 'projects/gallery' | 'services'
 * @param onProgress - Optional callback with upload percentage (0–100)
 */
export async function uploadFileToR2(
  file: File,
  prefix: string,
  onProgress?: (pct: number) => void,
  folder?: string,
): Promise<UploadResult> {
  // Step 1: Request presigned PUT URL from Next.js admin API
  const presignRes = await fetch('/api/admin/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, filename: file.name, contentType: file.type, ...(folder ? { folder } : {}) }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || 'Failed to get upload URL')
  }

  const { presignedUrl, key, publicUrl } = await presignRes.json()

  // Step 2: PUT file directly to R2 (no bytes through Next.js server)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return { key, publicUrl }
}

/**
 * Uploads a file to the private quotes bucket for client-submitted attachments.
 * Returns only the key (no public URL — bucket is private).
 */
export async function uploadQuoteAttachment(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const presignRes = await fetch('/api/upload/quote-attachment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || 'Failed to get upload URL')
  }

  const { presignedUrl, key } = await presignRes.json()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: HTTP ${xhr.status}`))
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return key
}
