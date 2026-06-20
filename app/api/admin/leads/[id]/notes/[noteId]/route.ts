import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadNoteRepository } from '@/infrastructure/repositories/DrizzleLeadNoteRepository'
import { UpdateLeadNoteUseCase } from '@/application/use-cases/leads/UpdateLeadNoteUseCase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { noteId } = await params
    const { body: noteBody } = await request.json()

    if (!noteBody) {
      return Response.json({ error: 'body is required' }, { status: 400 })
    }

    const useCase = new UpdateLeadNoteUseCase(new DrizzleLeadNoteRepository())
    const note = await useCase.execute(noteId, noteBody)

    return Response.json({ success: true, note })
  } catch (error) {
    console.error('Error updating lead note:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
