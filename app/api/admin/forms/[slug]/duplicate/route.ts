import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const { name, slug: newSlug } = body as { name?: string; slug?: string }

    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug) || newSlug.length > 150) {
      return Response.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only (max 150 chars)' }, { status: 400 })
    }

    const repo = new DrizzleFormRepository()

    try {
      const form = await repo.duplicate(slug, name.trim(), newSlug)
      return Response.json({ id: form.id, name: form.name, slug: form.slug }, { status: 201 })
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('unique')) {
          return Response.json({ error: 'Slug already taken' }, { status: 409 })
        }
        if (err.message.includes('not found')) {
          return Response.json({ error: err.message }, { status: 404 })
        }
      }
      throw err
    }
  } catch (error) {
    console.error('POST /api/admin/forms/[slug]/duplicate:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
