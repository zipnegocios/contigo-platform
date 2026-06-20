import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { ChangeLeadStageUseCase } from '@/application/use-cases/leads/ChangeLeadStageUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stage } = body

    if (!stage) {
      return Response.json({ error: 'Stage is required' }, { status: 400 })
    }

    // Validate stage is one of the allowed values
    const validStages = ['prospect', 'contacted', 'quoted', 'won', 'lost']
    if (!validStages.includes(stage)) {
      return Response.json(
        { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 },
      )
    }

    const leadRepo = new DrizzleLeadRepository()
    const existingLead = await leadRepo.findById(params.id)

    if (!existingLead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 })
    }

    const changeLeadStageUseCase = new ChangeLeadStageUseCase(
      leadRepo,
      new DrizzleLeadActivityRepository(),
    )

    const updatedLead = await changeLeadStageUseCase.execute(
      params.id,
      stage as 'prospect' | 'contacted' | 'quoted' | 'won' | 'lost',
      (session.user as any)?.id,
    )

    return Response.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
