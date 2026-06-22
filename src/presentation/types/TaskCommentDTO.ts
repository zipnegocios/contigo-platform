import { TaskComment } from '@/core/entities/TaskComment'

export interface TaskCommentDTO {
  id: string
  taskId: string
  body: string
  authorId: string | null
  createdAt: Date
  editedAt: Date | null
}

export function toTaskCommentDTO(comment: TaskComment): TaskCommentDTO {
  return {
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    authorId: comment.authorId,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
  }
}
