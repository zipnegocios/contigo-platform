import { Task, TaskStatus } from '@/core/entities/Task'

export interface TaskAssigneeDTO {
  id: string
  name: string
  email: string
}

export interface TaskDTO {
  id: string
  leadId: string
  title: string
  description: string | null
  dueDate: Date | null
  status: TaskStatus
  assigneeId: string | null
  assignee: TaskAssigneeDTO | null
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export function toTaskDTO(task: Task, assignee: TaskAssigneeDTO | null): TaskDTO {
  return {
    id: task.id,
    leadId: task.leadId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    assigneeId: task.assigneeId,
    assignee,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    archivedAt: task.archivedAt,
  }
}
