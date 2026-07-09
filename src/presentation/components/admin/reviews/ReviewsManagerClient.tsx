'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Star, Pin, Archive, ArchiveRestore, ExternalLink, LayoutGrid, List as ListIcon, MessageSquareReply } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { ReplyComposerDialog } from './ReplyComposerDialog'
import { ReviewTagsPopover } from './ReviewTagsPopover'
import { ReviewNotesPopover } from './ReviewNotesPopover'
import type { GoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'
import type { ReviewTag } from '@/core/repositories/IReviewTagRepository'

type SortMode = 'recent' | 'oldest' | 'rating' | 'length'
type ViewMode = 'table' | 'card'

interface ReviewsManagerClientProps {
  reviews: GoogleReviewDTO[]
  tags: ReviewTag[]
  googleMapsReviewUrl?: string
}

const ACTIVE_ICON_COLOR = 'var(--contigo-primary)'
const INACTIVE_ICON_COLOR = 'var(--neutral-600)'

export function ReviewsManagerClient({ reviews, tags: initialTags, googleMapsReviewUrl }: ReviewsManagerClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(reviews)
  const [tags, setTags] = useState(initialTags)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [replyFilter, setReplyFilter] = useState<string>('all')
  const [replyTarget, setReplyTarget] = useState<GoogleReviewDTO | null>(null)

  useEffect(() => setItems(reviews), [reviews])
  useEffect(() => setTags(initialTags), [initialTags])

  const visibleItems = useMemo(() => {
    let filtered = items.filter((r) => !r.deletedOnGoogleAt)

    if (ratingFilter !== 'all') filtered = filtered.filter((r) => r.rating === Number(ratingFilter))
    if (visibilityFilter === 'visible') filtered = filtered.filter((r) => r.isVisible)
    if (visibilityFilter === 'hidden') filtered = filtered.filter((r) => !r.isVisible)
    if (visibilityFilter === 'archived') filtered = filtered.filter((r) => !!r.archivedAt)
    if (visibilityFilter !== 'archived') filtered = filtered.filter((r) => !r.archivedAt)
    if (tagFilter !== 'all') filtered = filtered.filter((r) => r.tagIds.includes(tagFilter))
    if (replyFilter === 'replied') filtered = filtered.filter((r) => !!r.ownerReply)
    if (replyFilter === 'pending') filtered = filtered.filter((r) => r.comment && !r.ownerReply)

    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'oldest':
          return new Date(a.reviewCreatedAt).getTime() - new Date(b.reviewCreatedAt).getTime()
        case 'rating':
          return b.rating - a.rating
        case 'length':
          return (b.comment?.length ?? 0) - (a.comment?.length ?? 0)
        case 'recent':
        default:
          return new Date(b.reviewCreatedAt).getTime() - new Date(a.reviewCreatedAt).getTime()
      }
    })

    // Pinned reviews always float to the top, regardless of sort mode.
    return [...sorted].sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
  }, [items, ratingFilter, visibilityFilter, tagFilter, replyFilter, sortMode])

  async function patchReview(id: string, body: Record<string, unknown>) {
    const previous = items
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...body } as GoogleReviewDTO : r)))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Update failed')
      setItems((prev) => prev.map((r) => (r.id === id ? data.review : r)))
      router.refresh()
    } catch (err) {
      setItems(previous)
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  function handleReplied(updated: GoogleReviewDTO) {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-fluid-sm"
            style={{ border: '1px solid rgba(226,192,99,0.3)' }}
          >
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-fluid-sm"
            style={{ border: '1px solid rgba(226,192,99,0.3)' }}
          >
            <option value="all">All visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-fluid-sm"
            style={{ border: '1px solid rgba(226,192,99,0.3)' }}
          >
            <option value="all">All tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-fluid-sm"
            style={{ border: '1px solid rgba(226,192,99,0.3)' }}
          >
            <option value="all">All replies</option>
            <option value="replied">Replied</option>
            <option value="pending">Pending reply</option>
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="h-9 rounded-md px-3 text-fluid-sm"
            style={{ border: '1px solid rgba(226,192,99,0.3)' }}
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="rating">Highest rating</option>
            <option value="length">Longest comment</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-md p-1" style={{ border: '1px solid rgba(226,192,99,0.3)' }}>
          <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('table')}>
            <ListIcon className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('card')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {visibleItems.length === 0 && (
        <p className="text-fluid-sm py-8 text-center" style={{ color: 'var(--neutral-600)' }}>
          No reviews match these filters.
        </p>
      )}

      {viewMode === 'table' ? (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
          <table className="w-full text-fluid-sm">
            <thead>
              <tr style={{ backgroundColor: 'rgba(226, 192, 99, 0.06)', borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Reviewer</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Rating</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Comment</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Tags</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Date</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--neutral-600)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((review, i) => (
                <tr
                  key={review.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid rgba(226, 192, 99, 0.08)',
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {review.reviewerAvatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.reviewerAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>{review.reviewerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5"
                          fill={idx < review.rating ? '#E2C063' : 'none'}
                          stroke="#E2C063"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2" style={{ color: 'var(--neutral-800)' }}>
                      {review.comment ?? <span style={{ color: 'var(--neutral-600)' }}>No comment</span>}
                    </p>
                    {review.ownerReply && (
                      <p className="text-fluid-xs mt-1 italic" style={{ color: 'var(--contigo-primary)' }}>
                        Replied
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ReviewTagsPopover
                        reviewId={review.id}
                        tagIds={review.tagIds}
                        allTags={tags}
                        onTagsChanged={(tagIds) => setItems((prev) => prev.map((r) => (r.id === review.id ? { ...r, tagIds } : r)))}
                        onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
                      />
                      <ReviewNotesPopover
                        reviewId={review.id}
                        internalNotes={review.internalNotes}
                        onSaved={(notes) => setItems((prev) => prev.map((r) => (r.id === review.id ? { ...r, internalNotes: notes } : r)))}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                    {new Date(review.reviewCreatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={review.isVisible ? 'Hide from website' : 'Show on website'}
                        onClick={() => patchReview(review.id, { isVisible: !review.isVisible })}
                      >
                        {review.isVisible ? (
                          <Eye className="w-4 h-4" style={{ color: ACTIVE_ICON_COLOR }} />
                        ) : (
                          <EyeOff className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={review.isFeatured ? 'Unfeature' : 'Feature'}
                        onClick={() => patchReview(review.id, { isFeatured: !review.isFeatured })}
                      >
                        <Star className="w-4 h-4" fill={review.isFeatured ? '#E2C063' : 'none'} stroke="#E2C063" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={review.isPinned ? 'Unpin' : 'Pin'}
                        onClick={() => patchReview(review.id, { isPinned: !review.isPinned })}
                      >
                        <Pin
                          className="w-4 h-4"
                          style={{ color: review.isPinned ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR }}
                        />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Reply" onClick={() => setReplyTarget(review)}>
                        <MessageSquareReply className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={review.archivedAt ? 'Restore' : 'Archive'}
                        onClick={() => patchReview(review.id, { archived: !review.archivedAt })}
                      >
                        {review.archivedAt ? (
                          <ArchiveRestore className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                        ) : (
                          <Archive className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                        )}
                      </Button>
                      {googleMapsReviewUrl && (
                        <Button variant="ghost" size="icon-sm" title="Open on Google" asChild>
                          <a href={googleMapsReviewUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((review) => (
            <div
              key={review.id}
              className="rounded-xl p-4 space-y-3"
              style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {review.reviewerAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.reviewerAvatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  )}
                  <span className="truncate" style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
                    {review.reviewerName}
                  </span>
                </div>
                {review.isPinned && <Pin className="w-4 h-4 flex-shrink-0" style={{ color: ACTIVE_ICON_COLOR }} />}
              </div>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-3.5 h-3.5" fill={idx < review.rating ? '#E2C063' : 'none'} stroke="#E2C063" />
                ))}
              </div>

              <p className="text-fluid-sm line-clamp-3" style={{ color: 'var(--neutral-800)' }}>
                {review.comment ?? <span style={{ color: 'var(--neutral-600)' }}>No comment</span>}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <ReviewTagsPopover
                  reviewId={review.id}
                  tagIds={review.tagIds}
                  allTags={tags}
                  onTagsChanged={(tagIds) => setItems((prev) => prev.map((r) => (r.id === review.id ? { ...r, tagIds } : r)))}
                  onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
                />
                <ReviewNotesPopover
                  reviewId={review.id}
                  internalNotes={review.internalNotes}
                  onSaved={(notes) => setItems((prev) => prev.map((r) => (r.id === review.id ? { ...r, internalNotes: notes } : r)))}
                />
              </div>

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(226, 192, 99, 0.1)' }}>
                <span className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
                  {new Date(review.reviewCreatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" title={review.isVisible ? 'Hide' : 'Show'} onClick={() => patchReview(review.id, { isVisible: !review.isVisible })}>
                    {review.isVisible ? <Eye className="w-4 h-4" style={{ color: ACTIVE_ICON_COLOR }} /> : <EyeOff className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" title={review.isFeatured ? 'Unfeature' : 'Feature'} onClick={() => patchReview(review.id, { isFeatured: !review.isFeatured })}>
                    <Star className="w-4 h-4" fill={review.isFeatured ? '#E2C063' : 'none'} stroke="#E2C063" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Reply" onClick={() => setReplyTarget(review)}>
                    <MessageSquareReply className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title={review.archivedAt ? 'Restore' : 'Archive'} onClick={() => patchReview(review.id, { archived: !review.archivedAt })}>
                    {review.archivedAt ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" style={{ color: INACTIVE_ICON_COLOR }} />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReplyComposerDialog
        key={replyTarget?.id ?? 'none'}
        review={replyTarget}
        onOpenChange={(open) => !open && setReplyTarget(null)}
        onReplied={handleReplied}
      />
    </div>
  )
}
