import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const repo = new DrizzleFormRepository()
    const forms = await repo.findAll()

    return Response.json(forms)
  } catch (error) {
    console.error('GET /api/admin/forms:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug } = body as { name?: string; slug?: string }

    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > 150) {
      return Response.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only (max 150 chars)' }, { status: 400 })
    }

    const repo = new DrizzleFormRepository()

    try {
      const form = await repo.create(name.trim(), slug)
      return Response.json({ id: form.id, name: form.name, slug: form.slug }, { status: 201 })
    } catch (err) {
      // Postgres unique violation code 23505
      if (err instanceof Error && err.message.includes('unique')) {
        return Response.json({ error: 'Slug already taken' }, { status: 409 })
      }
      throw err
    }
  } catch (error) {
    console.error('POST /api/admin/forms:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
