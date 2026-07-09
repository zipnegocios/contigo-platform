import { ReviewsCarouselClient } from './ReviewsCarouselClient'
import type { PublicReviewDTO } from '@/application/use-cases/reviews/GetPublicReviewsUseCase'

interface ReviewsSectionProps {
  reviews: PublicReviewDTO[]
  averageRating: number
  count: number
  displayMode: 'carousel' | 'grid'
}

export default function ReviewsSection({ reviews, averageRating, count, displayMode }: ReviewsSectionProps) {
  if (reviews.length === 0) return null

  const roundedAverage = Math.round(averageRating)

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
        <div className="text-center mb-10 md:mb-14">
          <h2
            id="reviews-heading"
            className="text-fluid-2xl md:text-fluid-3xl"
            style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--petrol-800)', lineHeight: 1.15 }}
          >
            What our clients say
          </h2>

          <div className="flex items-center justify-center gap-2 mt-4" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={i < roundedAverage ? 'var(--gold-400)' : 'none'}
                stroke="var(--gold-400)"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className="text-fluid-sm mt-2" style={{ color: 'var(--neutral-500)' }}>
            <span style={{ fontWeight: 700, color: 'var(--petrol-800)' }}>{averageRating.toFixed(1)}</span> out of 5
            &nbsp;·&nbsp;{count} review{count === 1 ? '' : 's'} from Google
          </p>
        </div>

        <ReviewsCarouselClient reviews={reviews} enableCarousel={displayMode === 'carousel'} />
      </div>
    </section>
  )
}
