import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { ArchiveLeadUseCase } from '@/application/use-cases/leads/ArchiveLeadUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const useCase = new ArchiveLeadUseCase(new DrizzleLeadRepository())
    const lead = await useCase.execute(id)

    return Response.json({ success: true, lead })
  } catch (error) {
    console.error('Error archiving lead:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
