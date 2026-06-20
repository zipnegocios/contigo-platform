import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadNoteRepository } from '@/infrastructure/repositories/DrizzleLeadNoteRepository'
import { DrizzleLeadActivityRepository } from '@/infrastructure/repositories/DrizzleLeadActivityRepository'
import { AddLeadNoteUseCase } from '@/application/use-cases/leads/AddLeadNoteUseCase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const notes = await new DrizzleLeadNoteRepository().findByLeadId(id)
    return Response.json({ notes })
  } catch (error) {
    console.error('Error fetching lead notes:', error)
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
    const { body: noteBody } = body

    if (!noteBody) {
      return Response.json({ error: 'body is required' }, { status: 400 })
    }

    const useCase = new AddLeadNoteUseCase(
      new DrizzleLeadNoteRepository(),
      new DrizzleLeadActivityRepository(),
    )
    const note = await useCase.execute({
      leadId: id,
      body: noteBody,
      createdBy: (session.user as any)?.id,
    })

    return Response.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Error adding lead note:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
