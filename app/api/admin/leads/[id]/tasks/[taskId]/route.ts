import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleTaskRepository } from '@/infrastructure/repositories/DrizzleTaskRepository'
import { DrizzleAdminUserLookupRepository } from '@/infrastructure/repositories/DrizzleAdminUserLookupRepository'
import { UpdateTaskUseCase } from '@/application/use-cases/tasks/UpdateTaskUseCase'
import { AssignTaskUseCase } from '@/application/use-cases/tasks/AssignTaskUseCase'
import { Task } from '@/core/entities/Task'
import { toTaskDTO } from '@/presentation/types/TaskDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const task = await new DrizzleTaskRepository().findById(taskId)
    if (!task) return Response.json({ error: 'Task not found' }, { status: 404 })

    const assignee = task.assigneeId
      ? await new DrizzleAdminUserLookupRepository().findById(task.assigneeId)
      : null

    return Response.json({ task: toTaskDTO(task, assignee) })
  } catch (error) {
    console.error('Error fetching task:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const body = await request.json()
    const { title, description, dueDate, status, assigneeId } = body

    const hasDetailFields =
      title !== undefined || description !== undefined || dueDate !== undefined || status !== undefined

    if (!hasDetailFields && assigneeId === undefined) {
      return Response.json(
        { error: 'At least one field (title, description, dueDate, status, assigneeId) is required' },
        { status: 400 },
      )
    }

    const taskRepository = new DrizzleTaskRepository()
    let task: Task | undefined

    if (assigneeId !== undefined) {
      const assignUseCase = new AssignTaskUseCase(taskRepository)
      task = await assignUseCase.execute(taskId, assigneeId)
    }

    if (hasDetailFields) {
      const updateUseCase = new UpdateTaskUseCase(taskRepository)
      task = await updateUseCase.execute(taskId, {
        title,
        description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        status,
      })
    }

    const updatedTask = task as Task
    const assignee = updatedTask.assigneeId
      ? await new DrizzleAdminUserLookupRepository().findById(updatedTask.assigneeId)
      : null

    return Response.json({ success: true, task: toTaskDTO(updatedTask, assignee) })
  } catch (error) {
    console.error('Error updating task:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
