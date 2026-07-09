import { ReviewsCarouselClient } from './ReviewsCarouselClient'
import { ReviewsAggregateHeader } from './ReviewsAggregateHeader'
import type { PublicReviewDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

interface ReviewsSectionProps {
  reviews: PublicReviewDTO[]
  averageRating: number
  count: number
  displayMode: 'carousel' | 'grid'
}

export default function ReviewsSection({ reviews, averageRating, count, displayMode }: ReviewsSectionProps) {
  if (reviews.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Contigo Constructions',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: count,
    },
    review: reviews.slice(0, 20).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      author: { '@type': 'Person', name: r.reviewerName ?? 'Google user' },
      reviewBody: r.comment ?? undefined,
      datePublished: r.reviewCreatedAt,
    })),
  }

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-50)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-6xl mx-auto">
        <ReviewsAggregateHeader averageRating={averageRating} count={count} headingId="reviews-heading" />
        <ReviewsCarouselClient reviews={reviews} enableCarousel={displayMode === 'carousel'} />
      </div>
    </section>
  )
}
