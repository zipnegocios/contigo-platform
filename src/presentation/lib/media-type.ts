import { inferMediaType } from '@/core/lib/inferMediaType'

export function isVideoUrl(url: string): boolean {
  return inferMediaType(url) === 'video'
}

export function isImageUrl(url: string): boolean {
  return inferMediaType(url) === 'image'
}
