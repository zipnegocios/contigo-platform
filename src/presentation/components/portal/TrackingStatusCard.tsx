import { PipelineStage } from '@/core/entities/PipelineStage'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'

interface TrackingStatusCardProps {
  clientStage: {
    key: string
    label: string
    description: string
  }
  stages: PipelineStage[]
}

/**
 * Client stage badge + description, plus a multi-step "happy path" timeline
 * reconstructed from `pipeline_stages.position` (excluding the `terminalKind
 * === 'lost'` stage, which is not part of the normal progression).
 *
 * If the lead's current stage IS the `lost` stage, the happy-path timeline
 * doesn't apply, so we render a simpler "closed" state instead.
 */
export function TrackingStatusCard({ clientStage, stages }: TrackingStatusCardProps) {
  const currentStage = stages.find((stage) => stage.key === clientStage.key) ?? null
  const isClosed = currentStage?.terminalKind === 'lost'

  const happyPathStages = stages
    .filter((stage) => stage.terminalKind !== 'lost')
    .sort((a, b) => a.position - b.position)

  const currentPosition = currentStage?.position ?? -1

  return (
    <div
      className="rounded-lg shadow-lg p-8 mb-12 border-t-4"
      style={{
        background: 'white',
        borderTopColor: '#E2C063',
      }}
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-fluid-2xl font-bold" style={{ color: 'var(--heritage-charcoal)' }}>
          Project Status
        </h2>
        <span
          className="px-4 py-2 rounded-full text-white text-fluid-sm font-medium"
          style={{ background: isClosed ? 'var(--heritage-charcoal)' : '#E2C063' }}
        >
          {clientStage.label}
        </span>
      </div>

      <p className="text-fluid-base mb-8" style={{ color: 'var(--atelier-ink)' }}>
        {clientStage.description}
      </p>

      {isClosed ? (
        <p className="text-fluid-sm" style={{ color: 'var(--atelier-ink)', opacity: 0.7 }}>
          {getClientStageLabel('lost').description}
        </p>
      ) : (
        <div className="space-y-4">
          {happyPathStages.map((stage) => {
            const stageMeta = getClientStageLabel(stage.key)
            const isCompleted = currentPosition >= 0 && stage.position < currentPosition
            const isCurrent = stage.position === currentPosition
            const isReached = isCompleted || isCurrent

            return (
              <div key={stage.id} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    background: isReached ? '#E2C063' : '#ddd',
                  }}
                />
                <div className="ml-4 flex-1">
                  <p
                    className="text-fluid-sm font-medium"
                    style={{
                      color: isReached ? 'var(--heritage-charcoal)' : 'var(--atelier-ink)',
                      opacity: isReached ? 1 : 0.5,
                    }}
                  >
                    {stageMeta.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
