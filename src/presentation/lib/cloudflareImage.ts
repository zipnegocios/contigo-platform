const CF_ZONE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://contigoconstructions.com.au').replace(/\/$/, '')

interface CloudflareImageOptions {
  width?: number
  quality?: number
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
}

/**
 * Builds a Cloudflare Image Transformations URL for an image hosted on a remote origin
 * (like assets.contigoconstructions.com.au).
 * If `src` is a local asset (does not start with http), it is returned unmodified.
 */
export function cfImage(
  src: string | null | undefined,
  { width, quality = 75, fit = 'cover' }: CloudflareImageOptions = {},
): string {
  if (!src) return ''
  if (!src.startsWith('http')) return src

  const options = [
    width ? `width=${width}` : null,
    `quality=${quality}`,
    'format=auto',
    `fit=${fit}`,
  ]
    .filter(Boolean)
    .join(',')

  return `${CF_ZONE}/cdn-cgi/image/${options}/${src}`
}
