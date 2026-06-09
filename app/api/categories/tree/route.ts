import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { buildCategoryTree } from '@/lib/buildCategoryTree'
import type { CategoryType } from '@/types/category'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') ?? 'project') as CategoryType

    if (type !== 'project' && type !== 'service') {
      return Response.json({ error: 'type must be project or service' }, { status: 400 })
    }

    const repo = new DrizzleCategoryRepository()
    const flat = await repo.findFlat(type)
    const activeFlat = flat.filter((c) => c.isActive)
    const tree = buildCategoryTree(activeFlat)

    return Response.json({ tree, flat: activeFlat })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
