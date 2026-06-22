import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleTaskCommentRepository } from '@/infrastructure/repositories/DrizzleTaskCommentRepository'
import { EditTaskCommentUseCase } from '@/application/use-cases/tasks/EditTaskCommentUseCase'
import { DeleteTaskCommentUseCase } from '@/application/use-cases/tasks/DeleteTaskCommentUseCase'
import { toTaskCommentDTO } from '@/presentation/types/TaskCommentDTO'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string; commentId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { commentId } = await params
    const { body: commentBody } = await request.json()

    if (!commentBody) {
      return Response.json({ error: 'body is required' }, { status: 400 })
    }

    const useCase = new EditTaskCommentUseCase(new DrizzleTaskCommentRepository())
    const comment = await useCase.execute(commentId, commentBody)

    return Response.json({ success: true, comment: toTaskCommentDTO(comment) })
  } catch (error) {
    console.error('Error editing task comment:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string; commentId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { commentId } = await params
    const useCase = new DeleteTaskCommentUseCase(new DrizzleTaskCommentRepository())
    await useCase.execute(commentId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting task comment:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
