import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { CreatePipelineStageUseCase } from '@/application/use-cases/pipeline/CreatePipelineStageUseCase'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const stages = await new DrizzlePipelineStageRepository().findAll()
    return Response.json({ stages })
  } catch (error) {
    console.error('Error fetching pipeline stages:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { key, label, color } = body

    if (!key || !label || !color) {
      return Response.json({ error: 'key, label and color are required' }, { status: 400 })
    }

    const useCase = new CreatePipelineStageUseCase(new DrizzlePipelineStageRepository())
    const stage = await useCase.execute({ key, label, color })

    return Response.json({ success: true, stage }, { status: 201 })
  } catch (error) {
    console.error('Error creating pipeline stage:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
