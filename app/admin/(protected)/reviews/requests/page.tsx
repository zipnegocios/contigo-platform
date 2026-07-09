import Link from 'next/link'
import { DrizzleReviewRequestRepository } from '@/infrastructure/repositories/DrizzleReviewRequestRepository'
import { toReviewRequestDTO } from '@/presentation/types/ReviewRequestDTO'
import { ReviewRequestsManagerClient } from '@/presentation/components/admin/reviews/ReviewRequestsManagerClient'

export default async function ReviewRequestsPage() {
  const requests = await new DrizzleReviewRequestRepository().findAll()
  const dtos = requests.map(toReviewRequestDTO)

  const funnel = {
    scheduled: dtos.filter((r) => r.status === 'scheduled').length,
    sent: dtos.filter((r) => ['sent', 'opened', 'clicked'].includes(r.status)).length,
    opened: dtos.filter((r) => ['opened', 'clicked'].includes(r.status)).length,
    clicked: dtos.filter((r) => r.status === 'clicked').length,
    reviewed: dtos.filter((r) => r.status === 'reviewed_inferred').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Review Requests
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Requests scheduled for won leads.{' '}
          <Link href="/admin/reviews" className="underline" style={{ color: 'var(--contigo-primary)' }}>
            Back to reviews
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(funnel).map(([key, value]) => (
          <div key={key} className="rounded-xl p-4 text-center" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
            <p className="text-fluid-2xl font-bold" style={{ color: 'var(--petrol-800)' }}>{value}</p>
            <p className="text-fluid-xs uppercase tracking-wide" style={{ color: 'var(--neutral-600)' }}>{key}</p>
          </div>
        ))}
      </div>

      <ReviewRequestsManagerClient requests={dtos} />
    </div>
  )
}
