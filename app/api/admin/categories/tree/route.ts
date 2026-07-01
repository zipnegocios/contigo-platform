import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { buildCategoryTree } from '@/lib/buildCategoryTree'

export async function GET(_request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = new DrizzleCategoryRepository()
    // Admin must keep seeing inactive categories so they can be managed/reactivated.
    const flat = await repo.findFlat('shared', false)
    const tree = buildCategoryTree(flat)

    return Response.json({ tree, flat })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
