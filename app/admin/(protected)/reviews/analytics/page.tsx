import Link from 'next/link'
import { DrizzleGoogleReviewRepository } from '@/infrastructure/repositories/DrizzleGoogleReviewRepository'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { ReviewsAnalyticsClient } from '@/presentation/components/admin/reviews/ReviewsAnalyticsClient'

const MONTHS_BACK = 12

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

function lastNMonthKeys(n: number): string[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return keys
}

export default async function ReviewsAnalyticsPage() {
  const [reviews, requests] = await Promise.all([
    new DrizzleGoogleReviewRepository().findAll(),
    new DrizzleReviewRequestRepository().findAll(),
  ])

  const activeReviews = reviews.filter((r) => !r.deletedOnGoogleAt)
  const months = lastNMonthKeys(MONTHS_BACK)

  const reviewsByMonth = new Map<string, { count: number; ratingSum: number }>()
  for (const key of months) reviewsByMonth.set(key, { count: 0, ratingSum: 0 })
  for (const review of activeReviews) {
    const key = monthKey(review.reviewCreatedAt)
    const bucket = reviewsByMonth.get(key)
    if (bucket) {
      bucket.count++
      bucket.ratingSum += review.rating
    }
  }

  const reviewsPerMonth = months.map((key) => ({
    month: monthLabel(key),
    count: reviewsByMonth.get(key)!.count,
  }))
  const ratingTrend = months.map((key) => {
    const bucket = reviewsByMonth.get(key)!
    return { month: monthLabel(key), average: bucket.count ? Number((bucket.ratingSum / bucket.count).toFixed(2)) : null }
  })

  const starDistribution = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: activeReviews.filter((r) => r.rating === star).length,
  }))

  const repliedReviews = activeReviews.filter((r) => r.ownerReply && r.ownerReplyAt)
  const avgResponseDays = repliedReviews.length
    ? repliedReviews.reduce((sum, r) => sum + (r.ownerReplyAt!.getTime() - r.reviewCreatedAt.getTime()) / 86_400_000, 0) /
      repliedReviews.length
    : null

  const requestsByMonth = new Map<string, { sent: number; reviewed: number }>()
  for (const key of months) requestsByMonth.set(key, { sent: 0, reviewed: 0 })
  for (const request of requests) {
    const key = monthKey(request.createdAt)
    const bucket = requestsByMonth.get(key)
    if (!bucket) continue
    if (['sent', 'opened', 'clicked', 'reviewed_inferred'].includes(request.status)) bucket.sent++
    if (request.status === 'reviewed_inferred') bucket.reviewed++
  }
  const requestFunnelPerMonth = months.map((key) => ({
    month: monthLabel(key),
    sent: requestsByMonth.get(key)!.sent,
    reviewed: requestsByMonth.get(key)!.reviewed,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Review Analytics
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Computed live from current data — no separate rollup table yet (not needed at this volume).{' '}
          <Link href="/admin/reviews" className="underline" style={{ color: 'var(--contigo-primary)' }}>
            Back to reviews
          </Link>
        </p>
      </div>

      <ReviewsAnalyticsClient
        reviewsPerMonth={reviewsPerMonth}
        ratingTrend={ratingTrend}
        starDistribution={starDistribution}
        avgResponseDays={avgResponseDays}
        requestFunnelPerMonth={requestFunnelPerMonth}
      />
    </div>
  )
}
