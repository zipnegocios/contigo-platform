export type ButtonStyle = 'primary' | 'secondary'
export type ButtonLinkType = 'custom' | 'service' | 'project' | 'scroll'

export interface HeroButton {
  id: string
  label: string
  style: ButtonStyle
  linkType: ButtonLinkType
  href: string
  scrollTarget?: string
  entityId?: string
  entityLabel?: string
}

export interface HeroSlide {
  id: string
  desktopImageUrl: string
  mobileImageUrl?: string
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
  buttons: HeroButton[]
  slides: HeroSlide[]
  autoplayInterval: number
  overlayOpacity: number
  updatedAt: Date
}

export type HeroConfigInput = Omit<HeroConfig, 'id' | 'updatedAt'>
