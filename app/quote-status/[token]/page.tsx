import { notFound } from 'next/navigation'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export default async function QuoteStatusPage({
  params,
}: {
  params: { token: string }
}) {
  const repository = new DrizzleQuoteRepository()
  const quote = await repository.findByToken(params.token)

  if (!quote) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    new: '#D4AF37',
    contacted: '#8B7355',
    in_progress: '#4A90E2',
    converted: '#7ED321',
    closed: '#333333',
  }

  const statusLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    in_progress: 'In Progress',
    converted: 'Converted',
    closed: 'Closed',
  }

  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* Header band */}
      <div
        className="relative py-24 px-6 md:px-16"
        style={{
          backgroundColor: '#1E1A16',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <span
          className="block text-fluid-xs uppercase tracking-widest mb-4"
          style={{ color: '#E2C063' }}
        >
          Tracking
        </span>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
        >
          Your Quote Status
        </h1>
        <p className="text-fluid-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          Tracking reference: {params.token}
        </p>
      </div>

      <div className="page-padding max-w-2xl mx-auto pt-12">
        {/* Status Card */}
        <div
          className="rounded-lg shadow-lg p-8 mb-12 border-t-4"
          style={{
            background: 'white',
            borderTopColor: statusColors[quote.status],
          }}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-fluid-2xl font-bold" style={{ color: 'var(--heritage-charcoal)' }}>
              {quote.name}
            </h2>
            <span
              className="px-4 py-2 rounded-full text-white text-fluid-sm font-medium"
              style={{ background: statusColors[quote.status] }}
            >
              {statusLabels[quote.status]}
            </span>
          </div>

          {/* Quote Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-fluid-sm font-medium" style={{ color: 'var(--atelier-ink)' }}>
                Service Requested
              </label>
              <p className="mt-2 text-fluid-lg font-semibold" style={{ color: 'var(--heritage-charcoal)' }}>
                {quote.service}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-fluid-sm font-medium" style={{ color: 'var(--atelier-ink)' }}>
                  Email
                </label>
                <p className="mt-2" style={{ color: 'var(--heritage-charcoal)' }}>
                  {quote.email.toString()}
                </p>
              </div>
              {quote.phone && (
                <div>
                  <label className="block text-fluid-sm font-medium" style={{ color: 'var(--atelier-ink)' }}>
                    Phone
                  </label>
                  <p className="mt-2" style={{ color: 'var(--heritage-charcoal)' }}>
                    {quote.phone.toString()}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-fluid-sm font-medium" style={{ color: 'var(--atelier-ink)' }}>
                Your Message
              </label>
              <p className="mt-2 p-4 rounded bg-gray-50" style={{ color: 'var(--heritage-charcoal)' }}>
                {quote.message}
              </p>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--atelier-border)' }}>
              <p className="text-fluid-sm" style={{ color: 'var(--atelier-ink)', opacity: 0.7 }}>
                Submitted on {quote.createdAt.toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mb-12">
          <h3 className="text-fluid-lg font-bold mb-6" style={{ color: 'var(--heritage-charcoal)' }}>
            Progress Timeline
          </h3>
          <div className="space-y-4">
            {['new', 'contacted', 'in_progress', 'converted', 'closed'].map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: ['new', 'contacted', 'in_progress'].includes(quote.status)
                      ? index <= ['new', 'contacted', 'in_progress'].indexOf(quote.status)
                        ? statusColors[quote.status]
                        : '#ddd'
                      : statusColors[quote.status],
                  }}
                />
                <div className="ml-4 flex-1">
                  <p
                    className="text-fluid-sm font-medium"
                    style={{
                      color:
                        ['new', 'contacted', 'in_progress'].indexOf(quote.status) >= index
                          ? 'var(--heritage-charcoal)'
                          : 'var(--atelier-ink)',
                      opacity:
                        ['new', 'contacted', 'in_progress'].indexOf(quote.status) >= index ? 1 : 0.5,
                    }}
                  >
                    {statusLabels[stage as keyof typeof statusLabels]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-12">
          <p className="mb-6" style={{ color: 'var(--atelier-ink)' }}>
            Questions? Contact us directly at{' '}
            <strong>(08) 8123 4567</strong> or <strong>info@contigoconstructions.com.au</strong>
          </p>
          <a
            href="/"
            className="inline-flex btn-primary"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
