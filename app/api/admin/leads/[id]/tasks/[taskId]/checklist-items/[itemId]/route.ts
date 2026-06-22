import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { DrizzleTaskChecklistItemRepository } from '@/infrastructure/repositories/DrizzleTaskChecklistItemRepository'
import { ToggleChecklistItemUseCase } from '@/application/use-cases/tasks/ToggleChecklistItemUseCase'
import { RemoveChecklistItemUseCase } from '@/application/use-cases/tasks/RemoveChecklistItemUseCase'
import { toTaskChecklistItemDTO } from '@/presentation/types/TaskChecklistItemDTO'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { itemId } = await params
    const body = await request.json()
    const { isChecked } = body

    if (typeof isChecked !== 'boolean') {
      return Response.json({ error: 'isChecked (boolean) is required' }, { status: 400 })
    }

    const useCase = new ToggleChecklistItemUseCase(new DrizzleTaskChecklistItemRepository())
    const item = await useCase.execute(itemId)

    return Response.json({ success: true, item: toTaskChecklistItemDTO(item) })
  } catch (error) {
    console.error('Error toggling checklist item:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> },
) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any)?.id
    if (!userId || !(await hasPermission(userId, 'tasks.manage'))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { itemId } = await params
    const useCase = new RemoveChecklistItemUseCase(new DrizzleTaskChecklistItemRepository())
    await useCase.execute(itemId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error removing checklist item:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
