import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { DrizzleAdminUserLookupRepository } from '@/infrastructure/repositories/DrizzleAdminUserLookupRepository'
import { CreateTaskUseCase } from '@/application/use-cases/tasks/CreateTaskUseCase'
import { toTaskDTO } from '@/presentation/types/TaskDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const tasks = await new DrizzleTaskRepository().findByLeadId(id)

    const lookupRepo = new DrizzleAdminUserLookupRepository()
    const taskDTOs = await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assigneeId ? await lookupRepo.findById(task.assigneeId) : null
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

    const assignee = task.assigneeId
      ? await new DrizzleAdminUserLookupRepository().findById(task.assigneeId)
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
