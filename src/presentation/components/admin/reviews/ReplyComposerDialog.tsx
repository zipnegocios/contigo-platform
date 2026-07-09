'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/presentation/components/ui/dialog'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Button } from '@/presentation/components/ui/button'
import type { GoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'

const REPLY_CHAR_LIMIT = 4000

interface ReplyComposerDialogProps {
  review: GoogleReviewDTO | null
  onOpenChange: (open: boolean) => void
  onReplied: (review: GoogleReviewDTO) => void
}

export function ReplyComposerDialog({ review, onOpenChange, onReplied }: ReplyComposerDialogProps) {
  const [comment, setComment] = useState(review?.ownerReply ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handlePublish() {
    if (!review || !comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to publish reply')
      toast.success('Reply published to Google')
      onReplied(data.review)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish reply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!review) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/reply`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete reply')
      toast.success('Reply deleted')
      onReplied(data.review)
      setComment('')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!review} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply to {review?.reviewerName}</DialogTitle>
          <DialogDescription>
            This reply is published directly to your Google Business Profile and is publicly visible.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, REPLY_CHAR_LIMIT))}
          placeholder="Thank you for your feedback…"
          rows={6}
        />
        <p className="text-fluid-xs text-right" style={{ color: 'var(--neutral-600)' }}>
          {comment.length} / {REPLY_CHAR_LIMIT}
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          {review?.ownerReply ? (
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              Delete reply
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handlePublish} disabled={submitting || !comment.trim()}>
            {submitting ? 'Publishing…' : 'Publish to Google'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
