import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadContactRepository } from '@/infrastructure/repositories/DrizzleLeadContactRepository'
import { CreateLeadContactUseCase } from '@/application/use-cases/leads/CreateLeadContactUseCase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const contacts = await new DrizzleLeadContactRepository().findByLeadId(id)
    return Response.json({ contacts })
  } catch (error) {
    console.error('Error fetching lead contacts:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, phone, email, roleId, isPrimary } = body

    if (!name || !phone) {
      return Response.json({ error: 'name and phone are required' }, { status: 400 })
    }

    const useCase = new CreateLeadContactUseCase(new DrizzleLeadContactRepository())
    const contact = await useCase.execute({ leadId: id, name, phone, email, roleId, isPrimary })

    return Response.json({ success: true, contact }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead contact:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
