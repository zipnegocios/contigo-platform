'use client'

import { Avatar, AvatarFallback } from '@/presentation/components/ui/avatar'
import { Badge } from '@/presentation/components/ui/badge'
import type { TaskDTO } from '@/presentation/types/TaskDTO'

interface TaskCardProps {
  task: TaskDTO
  onClick: () => void
}

const STATUS_LABELS: Record<TaskDTO['status'], string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
}

const STATUS_VARIANTS: Record<TaskDTO['status'], 'secondary' | 'default' | 'outline'> = {
  open: 'secondary',
  in_progress: 'default',
  done: 'outline',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isOverdue(dueDate: Date | null, status: TaskDTO['status']): boolean {
  if (!dueDate || status === 'done') return false
  return dueDate.getTime() < Date.now()
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors hover:bg-black/5"
      style={{ border: '1px solid #E5DDD0' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-fluid-sm font-medium truncate" style={{ color: 'var(--neutral-800)' }}>
          {task.title}
        </p>
        {task.dueDate && (
          <p
            className="text-fluid-xs mt-0.5"
            style={{ color: overdue ? '#C0392B' : 'var(--neutral-600)' }}
          >
            Due {task.dueDate.toLocaleDateString()}
            {overdue ? ' · Overdue' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge variant={STATUS_VARIANTS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">
            {task.assignee ? initials(task.assignee.name) : '—'}
          </AvatarFallback>
        </Avatar>
      </div>
    </button>
  )
}
