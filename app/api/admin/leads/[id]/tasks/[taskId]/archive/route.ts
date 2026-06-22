import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { DrizzleAdminUserLookupRepository } from '@/infrastructure/repositories/DrizzleAdminUserLookupRepository'
import { ArchiveTaskUseCase } from '@/application/use-cases/tasks/ArchiveTaskUseCase'
import { toTaskDTO } from '@/presentation/types/TaskDTO'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const useCase = new ArchiveTaskUseCase(new DrizzleTaskRepository())
    const task = await useCase.execute(taskId)

    const assignee = task.assigneeId
      ? await new DrizzleAdminUserLookupRepository().findById(task.assigneeId)
      : null

    return Response.json({ success: true, task: toTaskDTO(task, assignee) })
  } catch (error) {
    console.error('Error archiving task:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
