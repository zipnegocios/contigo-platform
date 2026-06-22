'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { TaskCard } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import type { TaskDTO } from '@/presentation/types/TaskDTO'

interface LeadTasksPanelProps {
  leadId: string
}

function mapTask(raw: any): TaskDTO {
  return {
    ...raw,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt) : null,
  }
}

export function LeadTasksPanel({ leadId }: LeadTasksPanelProps) {
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null)

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/tasks`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setTasks((json.tasks ?? []).map(mapTask))
    } catch {
      toast.error('Could not load tasks')
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/leads/${leadId}/tasks`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setTasks((json.tasks ?? []).map(mapTask))
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load tasks')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [leadId])

  const createTask = async () => {
    const title = newTitle.trim()
    if (!title) return
    setCreating(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error()
      setNewTitle('')
      setShowNewForm(false)
      toast.success('Task created')
      await loadTasks()
    } catch {
      toast.error('Could not create task')
    } finally {
      setCreating(false)
    }
  }

  const visibleTasks = tasks.filter((t) => (showArchived ? t.archivedAt !== null : t.archivedAt === null))
  const hasArchived = tasks.some((t) => t.archivedAt !== null)

  const handleDrawerMutated = async () => {
    await loadTasks()
  }

  const handleDrawerClose = () => {
    setSelectedTask(null)
  }

  // Keep the drawer's task in sync with the latest list state (e.g. after a
  // status/assignee change refetches the list).
  useEffect(() => {
    if (!selectedTask) return
    const fresh = tasks.find((t) => t.id === selectedTask.id)
    if (fresh && fresh !== selectedTask) setSelectedTask(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--contigo-primary)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showNewForm ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                createTask()
              }
            }}
          />
          <Button size="sm" onClick={createTask} disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowNewForm(false)
              setNewTitle('')
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      )}

      <div className="space-y-2">
        {visibleTasks.length === 0 ? (
          <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
            {showArchived ? 'No deleted tasks.' : 'No tasks yet.'}
          </p>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
          ))
        )}
      </div>

      {hasArchived && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-fluid-xs underline"
          style={{ color: 'var(--neutral-600)' }}
        >
          {showArchived ? 'Hide deleted tasks' : 'Show deleted tasks'}
        </button>
      )}

      {selectedTask && (
        <TaskDetailDrawer
          leadId={leadId}
          task={selectedTask}
          onClose={handleDrawerClose}
          onMutated={handleDrawerMutated}
        />
      )}
    </div>
  )
}
