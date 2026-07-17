import { revalidatePath } from 'next/cache'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { resolveProjectCategorySlug } from '@/infrastructure/services/resolveProjectCategorySlug'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectRepo = new DrizzleProjectRepository()
    await projectRepo.restore(id)

    const restored = await projectRepo.findById(id)
    revalidatePath('/')
    revalidatePath('/projects')
    if (restored) revalidatePath(`/projects/${await resolveProjectCategorySlug(restored)}/${restored.slug}`)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
