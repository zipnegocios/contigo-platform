import type { HeroConfigInput } from '../entities/HeroConfig'
import type { HeroConfigVersion } from '../entities/HeroConfigVersion'

export interface IHeroConfigVersionRepository {
  /** Newest first. */
  list(): Promise<HeroConfigVersion[]>
  findById(id: string): Promise<HeroConfigVersion | null>
  /** Creates a non-archived version, then prunes recent versions beyond the cap (never `opts.protectId`). */
  create(
    label: string,
    snapshot: HeroConfigInput,
    opts?: { tag?: string; protectId?: string },
  ): Promise<HeroConfigVersion>
  update(id: string, patch: { archived?: boolean; tag?: string | null }): Promise<HeroConfigVersion | null>
  delete(id: string): Promise<void>
}
