import type { HeroConfigInput } from '@/core/entities/HeroConfig'

/** JSON with sorted keys and no undefined values, so key order never affects equality. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonicalize(v)]),
    )
  }
  return value
}

export function heroConfigFingerprint(config: HeroConfigInput): string {
  return JSON.stringify(canonicalize(config))
}

export function isSameHeroConfig(a: HeroConfigInput, b: HeroConfigInput): boolean {
  return heroConfigFingerprint(a) === heroConfigFingerprint(b)
}
