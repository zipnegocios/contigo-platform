import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { DrizzleAdminUserRepository } from '@/infrastructure/repositories/DrizzleAdminUserRepository'
import { CreateTaskUseCase } from '@/application/use-cases/tasks/CreateTaskUseCase'
import { toTaskDTO, TaskAssigneeDTO } from '@/presentation/types/TaskDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const tasks = await new DrizzleTaskRepository().findByLeadId(id)

    const lookupRepo = new DrizzleAdminUserRepository()
    const taskDTOs = await Promise.all(
      tasks.map(async (task) => {
        const assigneeUser = task.assigneeId ? await lookupRepo.findById(task.assigneeId) : null
        const assignee: TaskAssigneeDTO | null = assigneeUser
          ? { id: assigneeUser.id, name: assigneeUser.name, email: assigneeUser.email }
          : null
        return toTaskDTO(task, assignee)
      }),
    )

    return Response.json({ tasks: taskDTOs })
  } catch (error) {
    console.error('Error fetching lead tasks:', error)
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

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, dueDate, assigneeId } = body

    if (!title) {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }

    const useCase = new CreateTaskUseCase(new DrizzleTaskRepository())
    const task = await useCase.execute({
      leadId: id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId,
    })

    const assigneeUser = task.assigneeId
      ? await new DrizzleAdminUserRepository().findById(task.assigneeId)
      : null
    const assignee: TaskAssigneeDTO | null = assigneeUser
      ? { id: assigneeUser.id, name: assigneeUser.name, email: assigneeUser.email }
      : null

    return Response.json({ success: true, task: toTaskDTO(task, assignee) }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead task:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
