import type { HeroConfig, HeroConfigInput } from '../entities/HeroConfig'

export interface IHeroConfigRepository {
  get(): Promise<HeroConfig | null>
  upsert(input: HeroConfigInput): Promise<HeroConfig>
}
