export type ButtonStyle = 'primary' | 'secondary'
export type ButtonLinkType = 'custom' | 'service' | 'project' | 'scroll' | 'form'

export interface HeroButton {
  id: string
  label: string
  style: ButtonStyle
  linkType: ButtonLinkType
  href: string
  scrollTarget?: string
  entityId?: string
  entityLabel?: string
  formId?: string
  formSlug?: string
  formName?: string
}

export type HeroVideoAudio = 'off' | 'muted_toggle' | 'on'

export interface HeroVideoSettings {
  autoplay: boolean
  loop: boolean
  /** Seconds. Playback starts here (and loops back here). */
  startTime?: number
  /** Seconds. Playback stops / loops back to startTime when reached. */
  endTime?: number
  playbackRate: number
  objectPosition: string
  /** off: never sound · muted_toggle: starts muted, visitor can unmute · on: tries sound, falls back to muted. */
  audio: HeroVideoAudio
}

export interface HeroMedia {
  type: 'image' | 'video'
  url: string
  /** Fallback image for video: shown while loading, on error, reduced-motion and data-saver. */
  posterUrl?: string
  video?: HeroVideoSettings
}

export const DEFAULT_HERO_VIDEO_SETTINGS: HeroVideoSettings = {
  autoplay: true,
  loop: true,
  playbackRate: 1,
  objectPosition: 'center',
  audio: 'off',
}

/** Resolves the effective media for a slot: explicit media wins, otherwise the legacy image URL. */
export function resolveHeroMedia(media: HeroMedia | undefined, imageUrl: string | undefined): HeroMedia | undefined {
  if (media?.url) return media
  return imageUrl ? { type: 'image', url: imageUrl } : undefined
}

/** Image URL kept in the legacy column for a media slot (the poster when it is a video). */
export function legacyImageUrl(media: HeroMedia | undefined): string | undefined {
  if (!media) return undefined
  return media.type === 'image' ? media.url : media.posterUrl
}

export interface HeroSlide {
  id: string
  desktopImageUrl: string
  mobileImageUrl?: string
  desktopMedia?: HeroMedia
  mobileMedia?: HeroMedia
  headline: string
  subtitle?: string
  eyebrow?: string
  buttons: HeroButton[]
}

export interface HeroConfig {
  id: string
  mode: 'single' | 'slider'
  headline: string
  subtitle?: string
  eyebrow?: string
  desktopImageUrl?: string
  mobileImageUrl?: string
  desktopMedia?: HeroMedia
  mobileMedia?: HeroMedia
  buttons: HeroButton[]
  slides: HeroSlide[]
  autoplayInterval: number
  overlayOpacity: number
  updatedAt: Date
}

export type HeroConfigInput = Omit<HeroConfig, 'id' | 'updatedAt'>
