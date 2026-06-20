import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadNoteRepository } from '@/infrastructure/repositories/DrizzleLeadNoteRepository'
import { RestoreLeadNoteUseCase } from '@/application/use-cases/leads/RestoreLeadNoteUseCase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { noteId } = await params
    const useCase = new RestoreLeadNoteUseCase(new DrizzleLeadNoteRepository())
    const note = await useCase.execute(noteId)

    return Response.json({ success: true, note })
  } catch (error) {
    console.error('Error restoring lead note:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
