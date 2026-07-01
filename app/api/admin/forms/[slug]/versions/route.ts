import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'
import { buildZodValidator, type FormSchema } from '@/core/form-schema/FormSchema'

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
    const versions = await repo.findVersionsBySlug(slug)

    return Response.json(versions)
  } catch (error) {
    console.error('GET /api/admin/forms/[slug]/versions:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'form_builder.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const schema = body.schema as FormSchema | undefined

    if (!schema || !Array.isArray(schema.steps)) {
      return Response.json({ error: 'schema is required' }, { status: 400 })
    }

    try {
      buildZodValidator(schema)
    } catch (validationError) {
      return Response.json(
        { error: validationError instanceof Error ? validationError.message : 'Invalid form schema' },
        { status: 400 },
      )
    }

    const repository = new DrizzleFormRepository()
    const form = await repository.findBySlug(slug)
    if (!form) {
      return Response.json({ error: 'Form not found' }, { status: 404 })
    }

    const { formVersionId, version } = await repository.createNewVersion(form.formId, schema)

    return Response.json({ success: true, formVersionId, version }, { status: 201 })
  } catch (error) {
    console.error('Error creating form version:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
