interface ReviewsAggregateHeaderProps {
  averageRating: number
  count: number
  headingId?: string
}

/** Shared between the public ReviewsSection and the admin settings live preview. */
export function ReviewsAggregateHeader({ averageRating, count, headingId }: ReviewsAggregateHeaderProps) {
  const roundedAverage = Math.round(averageRating)

  return (
    <div className="text-center mb-10 md:mb-14">
      <h2
        id={headingId}
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
  )
}
