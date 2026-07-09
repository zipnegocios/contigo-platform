import Link from 'next/link'
import { Star, MessageSquareOff, Clock } from 'lucide-react'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewTagRepository } from '@/infrastructure/repositories/DrizzleReviewTagRepository'
import { DrizzleReviewSyncLogRepository } from '@/infrastructure/repositories/DrizzleReviewSyncLogRepository'
import { KPICard } from '@/presentation/components/admin/KPICard'
import { ReviewsManagerClient } from '@/presentation/components/admin/reviews/ReviewsManagerClient'
import { ReviewsSyncButton } from '@/presentation/components/admin/reviews/ReviewsSyncButton'
import { toGoogleReviewDTO } from '@/presentation/types/GoogleReviewDTO'

export default async function ReviewsPage() {
  const reviewRepository = new DrizzleGoogleReviewRepository()
  const tagRepository = new DrizzleReviewTagRepository()
  const syncLogRepository = new DrizzleReviewSyncLogRepository()

  const [reviews, tags, lastSync] = await Promise.all([
    reviewRepository.findAll(),
    tagRepository.findAll(),
    syncLogRepository.findLatest(),
  ])

  const dtos = await Promise.all(
    reviews.map(async (review) => toGoogleReviewDTO(review, await tagRepository.findTagIdsForReview(review.id))),
  )

  const activeReviews = reviews.filter((r) => !r.archivedAt && !r.deletedOnGoogleAt)
  const totalReviews = activeReviews.length
  const averageRating = totalReviews
    ? (activeReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '—'
  const pendingReplies = activeReviews.filter((r) => r.comment && !r.ownerReply).length

  const lastSyncLabel = !lastSync
    ? 'Never synced'
    : lastSync.status === 'success'
      ? `Success — ${lastSync.finishedAt?.toLocaleString() ?? ''}`
      : lastSync.status === 'failed'
        ? `Failed — ${lastSync.finishedAt?.toLocaleString() ?? ''}`
        : 'Running…'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Google Business
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Sync, moderate and reply to your Google reviews.{' '}
            <Link href="/admin/reviews/requests" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Requests
            </Link>
            {' · '}
            <Link href="/admin/reviews/analytics" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Analytics
            </Link>
            {' · '}
            <Link href="/admin/reviews/settings" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Settings
            </Link>
          </p>
        </div>
        <ReviewsSyncButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Reviews" value={totalReviews} icon={<Star className="w-5 h-5" />} />
        <KPICard title="Average Rating" value={averageRating} icon={<Star className="w-5 h-5" />} />
        <KPICard title="Pending Replies" value={pendingReplies} icon={<MessageSquareOff className="w-5 h-5" />} />
        <KPICard title="Last Sync" value={lastSyncLabel} icon={<Clock className="w-5 h-5" />} />
      </div>

      <ReviewsManagerClient
        reviews={dtos}
        tags={tags}
        googleMapsReviewUrl={
          process.env.GOOGLE_PLACE_ID
            ? `https://search.google.com/local/writereview?placeid=${process.env.GOOGLE_PLACE_ID}`
            : undefined
        }
      />
    </div>
  )
}
