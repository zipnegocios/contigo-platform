import { TaskChecklistItem } from '../entities/TaskChecklistItem'

export interface ITaskChecklistItemRepository {
  save(item: TaskChecklistItem): Promise<void>
  findById(id: string): Promise<TaskChecklistItem | null>
  findByTaskId(taskId: string): Promise<TaskChecklistItem[]>
  update(item: TaskChecklistItem): Promise<void>
  delete(id: string): Promise<void>
}
