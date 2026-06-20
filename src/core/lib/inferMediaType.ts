export type InferredMediaType = 'image' | 'video' | 'other'

export function inferMediaType(filenameOrKey: string): InferredMediaType {
  const ext = filenameOrKey.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)) return 'image'
  return 'other'
}
