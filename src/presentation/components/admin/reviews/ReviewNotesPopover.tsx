'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { StickyNote } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/presentation/components/ui/popover'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Button } from '@/presentation/components/ui/button'

interface ReviewNotesPopoverProps {
  reviewId: string
  internalNotes: string | null
  onSaved: (notes: string | null) => void
}

export function ReviewNotesPopover({ reviewId, internalNotes, onSaved }: ReviewNotesPopoverProps) {
  const [notes, setNotes] = useState(internalNotes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes.trim() === '' ? null : notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save notes')
      toast.success('Notes saved')
      onSaved(data.review.internalNotes)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-fluid-xs"
          style={{ color: internalNotes ? 'var(--contigo-primary)' : 'var(--neutral-600)' }}
          title={internalNotes ?? 'Add internal note'}
        >
          <StickyNote className="w-3.5 h-3.5" />
          {internalNotes ? 'Note' : 'Add note'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal note, not visible to the public…"
          rows={4}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
