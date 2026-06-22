import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskAttachmentRepository } from '@/infrastructure/repositories/DrizzleTaskAttachmentRepository'
import { RemoveTaskAttachmentUseCase } from '@/application/use-cases/tasks/RemoveTaskAttachmentUseCase'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string; attachmentId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { attachmentId } = await params
    const useCase = new RemoveTaskAttachmentUseCase(new DrizzleTaskAttachmentRepository())
    await useCase.execute(attachmentId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error removing task attachment:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
