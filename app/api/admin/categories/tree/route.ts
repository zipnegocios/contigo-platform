import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { buildCategoryTree } from '@/lib/buildCategoryTree'
import type { CategoryType } from '@/types/category'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') ?? 'project') as CategoryType

    if (type !== 'project' && type !== 'service') {
      return Response.json({ error: 'type must be project or service' }, { status: 400 })
    }

    const repo = new DrizzleCategoryRepository()
    // Admin must keep seeing inactive categories so they can be managed/reactivated.
    const flat = await repo.findFlat(type, false)
    const tree = buildCategoryTree(flat)

    return Response.json({ tree, flat })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
