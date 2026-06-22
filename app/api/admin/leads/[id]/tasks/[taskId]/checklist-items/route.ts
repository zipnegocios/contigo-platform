import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleTaskChecklistItemRepository } from '@/infrastructure/repositories/DrizzleTaskChecklistItemRepository'
import { AddChecklistItemUseCase } from '@/application/use-cases/tasks/AddChecklistItemUseCase'
import { toTaskChecklistItemDTO } from '@/presentation/types/TaskChecklistItemDTO'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId } = await params
    const items = await new DrizzleTaskChecklistItemRepository().findByTaskId(taskId)

    return Response.json({ items: items.map(toTaskChecklistItemDTO) })
  } catch (error) {
    console.error('Error fetching checklist items:', error)
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

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { taskId } = await params
    const body = await request.json()
    const { label, position } = body

    if (!label) {
      return Response.json({ error: 'label is required' }, { status: 400 })
    }

    const useCase = new AddChecklistItemUseCase(new DrizzleTaskChecklistItemRepository())
    const item = await useCase.execute({ taskId, label, position })

    return Response.json({ success: true, item: toTaskChecklistItemDTO(item) }, { status: 201 })
  } catch (error) {
    console.error('Error adding checklist item:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
