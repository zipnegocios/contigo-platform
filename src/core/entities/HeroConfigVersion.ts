import type { HeroConfigInput } from './HeroConfig'

export const MAX_RECENT_HERO_VERSIONS = 5

export interface HeroConfigVersion {
  id: string
  label: string
  snapshot: HeroConfigInput
  archivedAt?: Date
  createdAt: Date
}
