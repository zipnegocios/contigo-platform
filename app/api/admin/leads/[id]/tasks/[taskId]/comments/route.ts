import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskCommentRepository } from '@/infrastructure/repositories/DrizzleTaskCommentRepository'
import { AddTaskCommentUseCase } from '@/application/use-cases/tasks/AddTaskCommentUseCase'
import { toTaskCommentDTO } from '@/presentation/types/TaskCommentDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const comments = await new DrizzleTaskCommentRepository().findByTaskId(taskId)

    return Response.json({ comments: comments.map(toTaskCommentDTO) })
  } catch (error) {
    console.error('Error fetching task comments:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const body = await request.json()
    const { body: commentBody } = body

    if (!commentBody) {
      return Response.json({ error: 'body is required' }, { status: 400 })
    }

    const useCase = new AddTaskCommentUseCase(new DrizzleTaskCommentRepository())
    const comment = await useCase.execute({
      taskId,
      body: commentBody,
      authorId: (session.user as any)?.id,
    })

    return Response.json({ success: true, comment: toTaskCommentDTO(comment) }, { status: 201 })
  } catch (error) {
    console.error('Error adding task comment:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
