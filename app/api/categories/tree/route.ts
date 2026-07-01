import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { buildCategoryTree } from '@/lib/buildCategoryTree'

export async function GET(_request: Request) {
  try {
    const repo = new DrizzleCategoryRepository()
    const flat = await repo.findFlat('shared')
    const activeFlat = flat.filter((c) => c.isActive)
    const tree = buildCategoryTree(activeFlat)

    return Response.json({ tree, flat: activeFlat })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
