import { DrizzleFormRepository } from '@/infrastructure/repositories/DrizzleFormRepository'

// Public route — consumed by the marketing site's form renderer, no auth.
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    const repo = new DrizzleFormRepository()
    const activeVersion = await repo.findActiveVersionBySlug(slug)

    if (!activeVersion) {
      return Response.json({ message: 'Form not found' }, { status: 404 })
    }

    return Response.json(
      {
        schema: activeVersion.schema,
        formVersionId: activeVersion.formVersionId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Form fetch error:', error)

    return Response.json(
      { message: 'Failed to load form. Please try again.' },
      { status: 500 },
    )
  }
}
