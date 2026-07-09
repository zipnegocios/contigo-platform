'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Tag as TagIcon, Plus } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/presentation/components/ui/popover'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import type { ReviewTag } from '@/core/repositories/IReviewTagRepository'

interface ReviewTagsPopoverProps {
  reviewId: string
  tagIds: string[]
  allTags: ReviewTag[]
  onTagsChanged: (tagIds: string[]) => void
  onTagCreated: (tag: ReviewTag) => void
}

export function ReviewTagsPopover({ reviewId, tagIds, allTags, onTagsChanged, onTagCreated }: ReviewTagsPopoverProps) {
  const [pending, setPending] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)

  const activeTags = allTags.filter((t) => tagIds.includes(t.id))

  async function toggleTag(tagId: string, checked: boolean) {
    setPending(tagId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/tags/${tagId}`, {
        method: checked ? 'POST' : 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to update tags')
      onTagsChanged(checked ? [...tagIds, tagId] : tagIds.filter((id) => id !== tagId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tags')
    } finally {
      setPending(null)
    }
  }

  async function createTag() {
    if (!newTagName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/reviews/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create tag')
      onTagCreated(data.tag)
      setNewTagName('')
      await toggleTag(data.tag.id, true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 flex-wrap">
          {activeTags.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
              <TagIcon className="w-3.5 h-3.5" /> Add tags
            </span>
          ) : (
            activeTags.map((tag) => (
              <Badge key={tag.id} style={{ backgroundColor: `${tag.color}22`, color: tag.color }}>
                {tag.name}
              </Badge>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allTags.length === 0 && (
            <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
              No tags yet — create one below.
            </p>
          )}
          {allTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-fluid-sm cursor-pointer">
              <Checkbox
                checked={tagIds.includes(tag.id)}
                disabled={pending === tag.id}
                onCheckedChange={(checked) => toggleTag(tag.id, checked === true)}
              />
              {tag.name}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="h-8 text-fluid-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                createTag()
              }
            }}
          />
          <Button size="icon-sm" onClick={createTag} disabled={creating || !newTagName.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
