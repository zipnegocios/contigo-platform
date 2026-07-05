import { notFound } from 'next/navigation'
import { GetTrackingPanelDataUseCase } from '@/application/use-cases/portal/GetTrackingPanelDataUseCase'
import { GetLeadClientStageUseCase } from '@/application/use-cases/portal/GetLeadClientStageUseCase'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzlePipelineStageRepository } from '@/infrastructure/repositories/DrizzlePipelineStageRepository'
import { DrizzleLeadDocumentRepository } from '@/infrastructure/repositories/DrizzleLeadDocumentRepository'
import { DrizzleLeadEventRepository } from '@/infrastructure/repositories/DrizzleLeadEventRepository'
import { DrizzleLeadMessageRepository } from '@/infrastructure/repositories/DrizzleLeadMessageRepository'
import { toPipelineStageDTO } from '@/presentation/types/PipelineStageDTO'
import { TrackingStatusCard } from '@/presentation/components/portal/TrackingStatusCard'
import { TrackingDocumentsList } from '@/presentation/components/portal/TrackingDocumentsList'
import { TrackingScheduleList } from '@/presentation/components/portal/TrackingScheduleList'
import { TrackingMessages } from '@/presentation/components/portal/TrackingMessages'

// Token URLs are capability links shared privately (e.g. via email) — never
// index them in search engines.
export const metadata = {
  robots: { index: false, follow: false },
}

export default async function QuoteStatusPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const useCase = new GetTrackingPanelDataUseCase(
    new DrizzleQuoteRepository(),
    new DrizzleLeadRepository(),
    new DrizzlePipelineStageRepository(),
    new DrizzleLeadDocumentRepository(),
    new DrizzleLeadEventRepository(),
    new DrizzleLeadMessageRepository(),
    new GetLeadClientStageUseCase(
      new DrizzleQuoteRepository(),
      new DrizzleLeadRepository(),
      new DrizzlePipelineStageRepository(),
    ),
  )

  const panelData = await useCase.execute(token)

  if (!panelData) {
    notFound()
  }

  const stages = (await new DrizzlePipelineStageRepository().findAll()).map(toPipelineStageDTO)

  const { quote, clientStage, documents, events, messages } = panelData

  return (
    <div style={{ backgroundColor: 'var(--petrol-50)', minHeight: '100vh' }}>
      {/* Header band */}
      <div
        className="relative py-24 px-6 md:px-16"
        style={{
          backgroundColor: 'var(--petrol-900)',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <span
            className="block text-fluid-xs uppercase tracking-widest"
            style={{ color: '#E2C063' }}
          >
            Tracking
          </span>
        </div>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--petrol-50)' }}
        >
          Your Quote Status
        </h1>
        <p className="text-fluid-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          Tracking reference: {token}
        </p>
      </div>

      <div className="page-padding max-w-2xl mx-auto pt-12">
        {/* Quote summary card */}
        <div
          className="rounded-lg shadow-lg p-8 mb-12 border-t-4"
          style={{
            background: 'white',
            borderTopColor: '#E2C063',
          }}
        >
          <h2 className="text-fluid-2xl font-bold mb-8" style={{ color: 'var(--petrol-900)' }}>
            {quote.name}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-fluid-sm font-medium" style={{ color: 'var(--petrol-600)' }}>
                Service Requested
              </label>
              <p className="mt-2 text-fluid-lg font-semibold" style={{ color: 'var(--petrol-900)' }}>
                {quote.service}
              </p>
            </div>

            <div>
              <label className="block text-fluid-sm font-medium" style={{ color: 'var(--petrol-600)' }}>
                Your Message
              </label>
              <p className="mt-2 p-4 rounded bg-gray-50" style={{ color: 'var(--petrol-900)' }}>
                {quote.message}
              </p>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--petrol-100)' }}>
              <p className="text-fluid-sm" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
                Submitted on{' '}
                {quote.createdAt.toLocaleDateString('en-AU', {
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

        {/* Status + timeline */}
        <TrackingStatusCard token={token} clientStage={clientStage} stages={stages} />

        {/* Documents */}
        <TrackingDocumentsList token={token} documents={documents} attachmentUrls={quote.attachmentUrls} />

        {/* Schedule */}
        <TrackingScheduleList token={token} events={events} />

        {/* Messages */}
        <TrackingMessages token={token} messages={messages} />

        {/* CTA */}
        <div className="text-center pb-12">
          <p className="mb-6" style={{ color: 'var(--petrol-600)' }}>
            Questions? Contact us directly at{' '}
            <strong>+61 406 274 096</strong> or <strong>contact@contigoconstructions.com.au</strong>
          </p>
          <a href="/" className="inline-flex btn-primary">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
