import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { RenamePipelineStageUseCase } from '@/application/use-cases/pipeline/RenamePipelineStageUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'pipeline.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { label } = body

    if (!label) {
      return Response.json({ error: 'label is required' }, { status: 400 })
    }

    const useCase = new RenamePipelineStageUseCase(new DrizzlePipelineStageRepository())
    const stage = await useCase.execute(id, label)

    return Response.json({ success: true, stage })
  } catch (error) {
    console.error('Error renaming pipeline stage:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
