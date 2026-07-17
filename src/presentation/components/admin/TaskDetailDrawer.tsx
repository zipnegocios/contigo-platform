'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { MediaPickerModal } from './MediaPickerModal'
import type { TaskDTO } from '@/presentation/types/TaskDTO'
import type { TaskChecklistItemDTO } from '@/presentation/types/TaskChecklistItemDTO'
import type { TaskCommentDTO } from '@/presentation/types/TaskCommentDTO'
import type { TaskAttachmentDTO } from '@/presentation/types/TaskAttachmentDTO'

interface StaffMember {
  id: string
  name: string
  email: string
}

interface TaskDetailDrawerProps {
  leadId: string
  task: TaskDTO
  onClose: () => void
  onMutated: () => void
}

const STATUS_OPTIONS: { value: TaskDTO['status']; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

const ALLOWED_UPLOAD_TYPES =
  'image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function dateInputValue(d: Date | null): string {
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function TaskDetailDrawer({ leadId, task: initialTask, onClose, onMutated }: TaskDetailDrawerProps) {
  const [task, setTask] = useState<TaskDTO>(initialTask)
  const [loading, setLoading] = useState(true)

  const [checklist, setChecklist] = useState<TaskChecklistItemDTO[]>([])
  const [comments, setComments] = useState<TaskCommentDTO[]>([])
  const [attachments, setAttachments] = useState<TaskAttachmentDTO[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])

  const [title, setTitle] = useState(initialTask.title)
  const [description, setDescription] = useState(initialTask.description ?? '')
  const [dueDate, setDueDate] = useState(dateInputValue(initialTask.dueDate))

  const [newChecklistLabel, setNewChecklistLabel] = useState('')
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')

  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baseUrl = `/api/admin/leads/${leadId}/tasks/${task.id}`

  const loadSubResources = async () => {
    try {
      const [checklistRes, commentsRes, attachmentsRes] = await Promise.all([
        fetch(`${baseUrl}/checklist-items`),
        fetch(`${baseUrl}/comments`),
        fetch(`${baseUrl}/attachments`),
      ])
      const [checklistJson, commentsJson, attachmentsJson] = await Promise.all([
        checklistRes.json(),
        commentsRes.json(),
        attachmentsRes.json(),
      ])
      setChecklist(
        (checklistJson.items ?? []).map((i: TaskChecklistItemDTO) => ({ ...i })),
      )
      setComments(
        (commentsJson.comments ?? []).map((c: TaskCommentDTO) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          editedAt: c.editedAt ? new Date(c.editedAt) : null,
        })),
      )
      setAttachments(
        (attachmentsJson.attachments ?? []).map((a: TaskAttachmentDTO) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })),
      )
    } catch {
      toast.error('Could not load task details')
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([loadSubResources(), fetch('/api/admin/staff/options').then((r) => r.json())])
      .then(([, staffJson]) => {
        if (!cancelled) setStaff(staffJson.staff ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const patchTask = async (body: Record<string, unknown>) => {
    const res = await fetch(baseUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error()
    const json = await res.json()
    const updated: TaskDTO = {
      ...json.task,
      dueDate: json.task.dueDate ? new Date(json.task.dueDate) : null,
      createdAt: new Date(json.task.createdAt),
      updatedAt: new Date(json.task.updatedAt),
      archivedAt: json.task.archivedAt ? new Date(json.task.archivedAt) : null,
    }
    setTask(updated)
    onMutated()
    return updated
  }

  const saveDetails = async () => {
    try {
      await patchTask({
        title,
        description: description.trim() ? description : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      toast.success('Task updated')
    } catch {
      toast.error('Could not update task')
    }
  }

  const changeStatus = async (status: TaskDTO['status']) => {
    try {
      await patchTask({ status })
      toast.success('Status updated')
    } catch {
      toast.error('Could not update status')
    }
  }

  const changeAssignee = async (assigneeId: string) => {
    try {
      await patchTask({ assigneeId: assigneeId === 'unassigned' ? null : assigneeId })
      toast.success('Assignee updated')
    } catch {
      toast.error('Could not update assignee')
    }
  }

  const archiveTask = async () => {
    try {
      const res = await fetch(`${baseUrl}/archive`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Task deleted')
      onMutated()
      onClose()
    } catch {
      toast.error('Could not delete task')
    }
  }

  // ── Checklist ───────────────────────────────────────────────────────────

  const addChecklistItem = async () => {
    const label = newChecklistLabel.trim()
    if (!label) return
    try {
      const res = await fetch(`${baseUrl}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) throw new Error()
      setNewChecklistLabel('')
      await loadSubResources()
    } catch {
      toast.error('Could not add checklist item')
    }
  }

  const toggleChecklistItem = async (itemId: string, nextChecked: boolean) => {
    try {
      const res = await fetch(`${baseUrl}/checklist-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: nextChecked }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      // Server flips current state and returns the authoritative result —
      // trust the response, not the optimistic value we sent.
      setChecklist((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isChecked: json.item.isChecked } : i)),
      )
    } catch {
      toast.error('Could not update checklist item')
    }
  }

  const removeChecklistItem = async (itemId: string) => {
    try {
      const res = await fetch(`${baseUrl}/checklist-items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setChecklist((prev) => prev.filter((i) => i.id !== itemId))
    } catch {
      toast.error('Could not remove checklist item')
    }
  }

  // ── Comments ────────────────────────────────────────────────────────────

  const authorName = (authorId: string | null): string => {
    if (!authorId) return '—'
    const match = staff.find((s) => s.id === authorId)
    return match ? match.name : '—'
  }

  const addComment = async () => {
    const body = newComment.trim()
    if (!body) return
    try {
      const res = await fetch(`${baseUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error()
      setNewComment('')
      await loadSubResources()
    } catch {
      toast.error('Could not add comment')
    }
  }

  const saveCommentEdit = async (commentId: string) => {
    const body = editingCommentBody.trim()
    if (!body) return
    try {
      const res = await fetch(`${baseUrl}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error()
      setEditingCommentId(null)
      setEditingCommentBody('')
      await loadSubResources()
    } catch {
      toast.error('Could not edit comment')
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`${baseUrl}/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      toast.error('Could not delete comment')
    }
  }

  // ── Attachments ─────────────────────────────────────────────────────────

  const attachFile = async (payload: { key: string; filename: string }) => {
    const res = await fetch(`${baseUrl}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error()
  }

  const handleMediaLibrarySelect = async (publicUrl: string) => {
    setPickerOpen(false)
    try {
      const key = publicUrl.replace(`${ASSETS_BASE_URL}/`, '')
      const filename = key.split('/').pop() ?? key
      await attachFile({ key, filename })
      toast.success('Attachment added')
      await loadSubResources()
    } catch {
      toast.error('Could not attach file')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      const presignRes = await fetch(`/api/admin/leads/${leadId}/tasks/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) {
        const errorBody = await presignRes.json().catch(() => null)
        const detail = errorBody?.details?.[0]?.message ?? errorBody?.error ?? undefined
        throw new Error(detail)
      }
      const { presignedUrl, key } = await presignRes.json()

      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!putRes.ok) throw new Error()

      await attachFile({ key, filename: file.name })
      toast.success('File uploaded')
      await loadSubResources()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : null
      toast.error(message ? `Could not upload file: ${message}` : 'Could not upload file')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = async (attachmentId: string) => {
    try {
      const res = await fetch(`${baseUrl}/attachments/${attachmentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    } catch {
      toast.error('Could not remove attachment')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-stretch justify-end"
      style={{ backgroundColor: 'rgba(30,26,22,0.72)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-2xl h-full overflow-y-auto"
        style={{ backgroundColor: 'var(--neutral-50)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ backgroundColor: '#fff', border: '1px solid #E5DDD0' }}
        >
          <X className="h-5 w-5" style={{ color: 'var(--neutral-600)' }} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--contigo-primary)' }} />
          </div>
        ) : (
          <div className="px-6 py-10 space-y-8">
            {/* Title / description / due date */}
            <div className="space-y-3 pr-10">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveDetails}
                className="text-lg font-semibold h-auto"
                placeholder="Task title"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDetails}
                placeholder="Description"
                rows={4}
              />
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    Due date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={saveDetails}
                    className="w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Status + assignee */}
            <div className="flex flex-wrap gap-6">
              <div className="space-y-1">
                <label className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                  Status
                </label>
                <Select value={task.status} onValueChange={(v) => changeStatus(v as TaskDTO['status'])}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                  Assignee
                </label>
                <Select value={task.assigneeId ?? 'unassigned'} onValueChange={changeAssignee}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} &lt;{member.email}&gt;
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist */}
            <section className="space-y-3">
              <h3 className="text-fluid-sm font-semibold" style={{ color: 'var(--neutral-800)' }}>
                Checklist
              </h3>
              <div className="space-y-2">
                {checklist.length === 0 ? (
                  <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    No checklist items yet.
                  </p>
                ) : (
                  checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.isChecked}
                        onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                      />
                      <span
                        className="flex-1 text-fluid-sm"
                        style={{
                          color: item.isChecked ? 'var(--neutral-600)' : 'var(--neutral-800)',
                          textDecoration: item.isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="p-1 rounded hover:bg-black/5"
                        aria-label="Remove item"
                      >
                        <X className="h-3.5 w-3.5" style={{ color: 'var(--neutral-600)' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addChecklistItem()
                    }
                  }}
                  placeholder="Add checklist item"
                />
                <Button size="sm" variant="outline" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </section>

            {/* Comments */}
            <section className="space-y-3">
              <h3 className="text-fluid-sm font-semibold" style={{ color: 'var(--neutral-800)' }}>
                Comments
              </h3>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    No comments yet.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg p-3" style={{ border: '1px solid #E5DDD0' }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-fluid-xs font-medium" style={{ color: 'var(--neutral-800)' }}>
                          {authorName(comment.authorId)}
                        </p>
                        <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                          {comment.createdAt.toLocaleString()}
                          {comment.editedAt ? ' · edited' : ''}
                        </p>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveCommentEdit(comment.id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentBody('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-fluid-sm whitespace-pre-wrap mt-1" style={{ color: 'var(--neutral-800)' }}>
                            {comment.body}
                          </p>
                          <div className="flex gap-3 mt-2">
                            <button
                              type="button"
                              className="text-fluid-xs underline"
                              style={{ color: 'var(--neutral-600)' }}
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingCommentBody(comment.body)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-fluid-xs underline"
                              style={{ color: 'var(--neutral-600)' }}
                              onClick={() => deleteComment(comment.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  rows={3}
                />
                <Button size="sm" variant="outline" onClick={addComment}>
                  Comment
                </Button>
              </div>
            </section>

            {/* Attachments */}
            <section className="space-y-3">
              <h3 className="text-fluid-sm font-semibold" style={{ color: 'var(--neutral-800)' }}>
                Attachments
              </h3>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                    No attachments yet.
                  </p>
                ) : (
                  attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-3 rounded-lg p-3"
                      style={{ border: '1px solid #E5DDD0' }}
                    >
                      <p className="text-fluid-sm break-all" style={{ color: 'var(--neutral-800)' }}>
                        {att.filename}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1.5 rounded hover:bg-black/5 flex-shrink-0"
                        aria-label="Remove attachment"
                      >
                        <Trash2 className="h-4 w-4" style={{ color: 'var(--neutral-600)' }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Choose from Media Library
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : 'Upload new'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_UPLOAD_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </section>

            <div className="pt-4" style={{ borderTop: '1px solid #E5DDD0' }}>
              <Button variant="ghost" size="sm" onClick={archiveTask}>
                Delete task
              </Button>
            </div>
          </div>
        )}
      </div>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleMediaLibrarySelect} />
    </div>,
    document.body,
  )
}
