'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import type { LeadNoteDTO } from '@/presentation/types/LeadNoteDTO'

interface LeadNotesPanelProps {
  leadId: string
  notes: LeadNoteDTO[]
  onMutated?: () => void
}

export function LeadNotesPanel({ leadId, notes, onMutated }: LeadNotesPanelProps) {
  const router = useRouter()
  const [newBody, setNewBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [saving, setSaving] = useState(false)

  const afterMutation = () => {
    router.refresh()
    onMutated?.()
  }

  const addNote = async () => {
    if (!newBody.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newBody }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      setNewBody('')
      toast.success('Note added')
      afterMutation()
    } catch {
      toast.error('Could not add note')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async (noteId: string) => {
    if (!editBody.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editBody }),
      })
      if (!res.ok) throw new Error('Failed to update note')
      setEditingId(null)
      toast.success('Note updated')
      afterMutation()
    } catch {
      toast.error('Could not update note')
    } finally {
      setSaving(false)
    }
  }

  const archiveNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes/${noteId}/archive`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to archive note')
      toast.success('Note deleted')
      afterMutation()
    } catch {
      toast.error('Could not delete note')
    }
  }

  const restoreNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes/${noteId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore note')
      toast.success('Note restored')
      afterMutation()
    } catch {
      toast.error('Could not restore note')
    }
  }

  const visibleNotes = notes.filter((n) => (showArchived ? n.archivedAt !== null : n.archivedAt === null))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-fluid-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--neutral-600)' }}>
          Notes
        </label>
        <div className="space-y-2">
          <Textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Add a note about this lead…"
            className="min-h-20 text-fluid-sm resize-none"
            style={{ borderColor: 'var(--neutral-200)' }}
          />
          <Button onClick={addNote} disabled={saving || !newBody.trim()} size="sm">
            Add note
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {visibleNotes.length === 0 ? (
          <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
            {showArchived ? 'No deleted notes.' : 'No notes yet.'}
          </p>
        ) : (
          visibleNotes.map((note) => (
            <div key={note.id} className="rounded-lg p-3" style={{ border: '1px solid #E5DDD0' }}>
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="min-h-16 text-fluid-sm resize-none"
                    style={{ borderColor: 'var(--neutral-200)' }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(note.id)} disabled={saving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-fluid-sm whitespace-pre-wrap" style={{ color: 'var(--neutral-800)' }}>{note.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                      {note.createdAt.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      {note.archivedAt ? (
                        <Button size="sm" variant="outline" onClick={() => restoreNote(note.id)}>Restore</Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(note.id); setEditBody(note.body) }}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => archiveNote(note.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {notes.some((n) => n.archivedAt !== null) && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-fluid-xs underline"
          style={{ color: 'var(--neutral-600)' }}
        >
          {showArchived ? 'Hide deleted notes' : 'Show deleted notes'}
        </button>
      )}
    </div>
  )
}
