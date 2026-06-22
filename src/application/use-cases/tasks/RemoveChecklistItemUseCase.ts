import { ITaskChecklistItemRepository } from '@/core/repositories/ITaskChecklistItemRepository'

export class RemoveChecklistItemUseCase {
  constructor(private taskChecklistItemRepository: ITaskChecklistItemRepository) {}

  async execute(itemId: string): Promise<void> {
    const item = await this.taskChecklistItemRepository.findById(itemId)
    if (!item) throw new Error('Checklist item not found')

    await this.taskChecklistItemRepository.delete(itemId)
  }
}
