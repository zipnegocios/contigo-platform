import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { ArchiveTaskUseCase } from '@/application/use-cases/tasks/ArchiveTaskUseCase'
import { toTaskDTO, TaskAssigneeDTO } from '@/presentation/types/TaskDTO'

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

    const assigneeUser = task.assigneeId
      ? await new DrizzleAdminUserRepository().findById(task.assigneeId)
      : null
    const assignee: TaskAssigneeDTO | null = assigneeUser
      ? { id: assigneeUser.id, name: assigneeUser.name, email: assigneeUser.email }
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
