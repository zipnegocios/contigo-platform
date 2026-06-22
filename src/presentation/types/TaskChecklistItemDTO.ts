import { TaskChecklistItem } from '@/core/entities/TaskChecklistItem'

export interface TaskChecklistItemDTO {
  id: string
  taskId: string
  label: string
  position: number
  isChecked: boolean
}

export function toTaskChecklistItemDTO(item: TaskChecklistItem): TaskChecklistItemDTO {
  return {
    id: item.id,
    taskId: item.taskId,
    label: item.label,
    position: item.position,
    isChecked: item.isChecked,
  }
}
