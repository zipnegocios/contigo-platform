import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { ReorderPipelineStagesUseCase } from '@/application/use-cases/pipeline/ReorderPipelineStagesUseCase'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'pipeline.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return Response.json({ error: 'orderedIds must be a non-empty array' }, { status: 400 })
    }

    const useCase = new ReorderPipelineStagesUseCase(new DrizzlePipelineStageRepository())
    await useCase.execute(orderedIds)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error reordering pipeline stages:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
