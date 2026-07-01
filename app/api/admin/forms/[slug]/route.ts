import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'

const SYSTEM_FORMS = ['request-a-quote']

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const repo = new DrizzleFormRepository()
    const form = await repo.findActiveVersionBySlug(slug)

    if (!form) return Response.json({ error: 'Form not found' }, { status: 404 })

    return Response.json(form)
  } catch (error) {
    console.error('GET /api/admin/forms/[slug]:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params

    if (SYSTEM_FORMS.includes(slug)) {
      return Response.json({ error: 'System form cannot be renamed' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const repo = new DrizzleFormRepository()
    await repo.update(slug, { name: name.trim() })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/admin/forms/[slug]:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string })?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params

    if (SYSTEM_FORMS.includes(slug)) {
      return Response.json({ error: 'System form cannot be deleted' }, { status: 403 })
    }

    const repo = new DrizzleFormRepository()
    await repo.hardDelete(slug)

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/forms/[slug]:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
