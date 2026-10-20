import type { HeroConfigInput } from '../entities/HeroConfig'
import type { HeroConfigVersion } from '../entities/HeroConfigVersion'

export interface IHeroConfigVersionRepository {
  /** Newest first. */
  list(): Promise<HeroConfigVersion[]>
  findById(id: string): Promise<HeroConfigVersion | null>
  /** Creates a non-archived version, then prunes recent versions beyond the cap (never `protectId`). */
  create(label: string, snapshot: HeroConfigInput, protectId?: string): Promise<HeroConfigVersion>
  setArchived(id: string, archived: boolean): Promise<HeroConfigVersion | null>
  delete(id: string): Promise<void>
}
