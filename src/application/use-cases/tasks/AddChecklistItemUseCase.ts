import { TaskChecklistItem } from '@/core/entities/TaskChecklistItem'
import { ITaskChecklistItemRepository } from '@/core/repositories/ITaskChecklistItemRepository'

export class AddChecklistItemUseCase {
  constructor(private taskChecklistItemRepository: ITaskChecklistItemRepository) {}

  async execute(input: { taskId: string; label: string; position?: number }): Promise<TaskChecklistItem> {
    const item = TaskChecklistItem.create(input)
    await this.taskChecklistItemRepository.save(item)
    return item
  }
}
