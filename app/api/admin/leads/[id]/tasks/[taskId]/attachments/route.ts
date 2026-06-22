import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleTaskAttachmentRepository } from '@/infrastructure/repositories/DrizzleTaskAttachmentRepository'
import { AddTaskAttachmentUseCase } from '@/application/use-cases/tasks/AddTaskAttachmentUseCase'
import { toTaskAttachmentDTO } from '@/presentation/types/TaskAttachmentDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const attachments = await new DrizzleTaskAttachmentRepository().findByTaskId(taskId)

    return Response.json({ attachments: attachments.map(toTaskAttachmentDTO) })
  } catch (error) {
    console.error('Error fetching task attachments:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

// Step 2 of 2 for new uploads (see .../tasks/presign/route.ts for step 1),
// or the only step when attaching a file already chosen from the Media
// Library — either way this just records a { key, filename } reference.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { taskId } = await params
    const body = await request.json()
    const { key, filename } = body

    if (!key || !filename) {
      return Response.json({ error: 'key and filename are required' }, { status: 400 })
    }

    const useCase = new AddTaskAttachmentUseCase(new DrizzleTaskAttachmentRepository())
    const attachment = await useCase.execute({ taskId, key, filename })

    return Response.json(
      { success: true, attachment: toTaskAttachmentDTO(attachment) },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error adding task attachment:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
