interface ReviewsAggregateHeaderProps {
  averageRating: number
  count: number
  headingId?: string
  /** Business reviews page on Google; opens in a new tab. */
  googleReviewsUrl?: string
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

/** Shared between the public ReviewsSection and the admin settings live preview. */
export function ReviewsAggregateHeader({ averageRating, count, headingId, googleReviewsUrl }: ReviewsAggregateHeaderProps) {
  const roundedAverage = Math.round(averageRating)

  return (
    <div className="text-center mb-12">
      {/* Same eyebrow + h2 treatment as the other homepage sections (e.g. ServicesSection). */}
      <span className="label block mb-4" style={{ color: 'var(--contigo-primary)' }}>
        CLIENT REVIEWS
      </span>
      <h2 id={headingId} style={{ color: 'var(--neutral-800)' }}>
        What Our Clients Say
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
      {googleReviewsUrl && (
        <a
          href={googleReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-fluid-sm underline-offset-4 hover:underline"
          style={{ color: 'var(--contigo-primary)', fontWeight: 600 }}
        >
          See all reviews on Google
          <ExternalLinkIcon />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}
