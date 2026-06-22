import { TaskComment } from '../entities/TaskComment'

export interface ITaskCommentRepository {
  save(comment: TaskComment): Promise<void>
  findById(id: string): Promise<TaskComment | null>
  findByTaskId(taskId: string): Promise<TaskComment[]>
  update(comment: TaskComment): Promise<void>
  delete(id: string): Promise<void>
}
