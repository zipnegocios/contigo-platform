'use client'

export interface ExtractedMetadata {
  width?: number
  height?: number
  duration?: number
  format?: string
}

export function extractMediaMetadata(file: File): Promise<ExtractedMetadata> {
  return new Promise((resolve) => {
    const format = file.type
    const url = URL.createObjectURL(file)

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img')
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight, format })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        resolve({ format })
        URL.revokeObjectURL(url)
      }
      img.src = url
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth || undefined,
          height: video.videoHeight || undefined,
          duration: isFinite(video.duration) ? Math.round(video.duration) : undefined,
          format,
        })
        URL.revokeObjectURL(url)
      }
      video.onerror = () => {
        resolve({ format })
        URL.revokeObjectURL(url)
      }
      video.src = url
    } else {
      resolve({ format })
    }
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function aspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const d = gcd(width, height)
  const w = width / d
  const h = height / d
  // Normalise common ratios
  if (w <= 20 && h <= 20) return `${w}:${h}`
  // Fallback to decimal
  return `${(width / height).toFixed(2)}:1`
}
