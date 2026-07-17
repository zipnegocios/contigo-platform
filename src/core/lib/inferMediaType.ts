export type InferredMediaType = 'image' | 'video' | 'other'

export function inferMediaType(filenameOrKey: string): InferredMediaType {
  // Strip query string/hash first — gallery/R2 URLs commonly carry one
  // (e.g. `video.mp4?token=...`), which would otherwise poison the extension.
  const withoutQuery = filenameOrKey.split(/[?#]/)[0]
  const ext = withoutQuery.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)) return 'image'
  return 'other'
}
