import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string; versionId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug, versionId } = await params
    const repo = new DrizzleFormRepository()

    try {
      await repo.revertToVersion(slug, versionId)
      return Response.json({ success: true })
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        return Response.json({ error: err.message }, { status: 404 })
      }
      throw err
    }
  } catch (error) {
    console.error('POST /api/admin/forms/[slug]/versions/[versionId]/revert:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
