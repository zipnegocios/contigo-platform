import { TaskChecklistItem } from '@/core/entities/TaskChecklistItem'
import { ITaskChecklistItemRepository } from '@/core/repositories/ITaskChecklistItemRepository'

export class ToggleChecklistItemUseCase {
  constructor(private taskChecklistItemRepository: ITaskChecklistItemRepository) {}

  async execute(itemId: string): Promise<TaskChecklistItem> {
    const item = await this.taskChecklistItemRepository.findById(itemId)
    if (!item) throw new Error('Checklist item not found')

    const toggled = item.toggle()
    await this.taskChecklistItemRepository.update(toggled)
    return toggled
  }
}
