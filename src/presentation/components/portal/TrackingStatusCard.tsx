'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { PipelineStageDTO } from '@/presentation/types/PipelineStageDTO'
import { getClientStageLabel } from '@/presentation/lib/clientStageLabels'
import { useSSE } from '@/presentation/hooks/useSSE'

interface ClientStage {
  key: string
  label: string
  description: string
}

interface TrackingStatusCardProps {
  token: string
  clientStage: ClientStage
  stages: PipelineStageDTO[]
}

/**
 * Client stage badge + description, plus a multi-step "happy path" timeline
 * reconstructed from `pipeline_stages.position` (excluding the `terminalKind
 * === 'lost'` stage, which is not part of the normal progression).
 *
 * If the lead's current stage IS the `lost` stage, the happy-path timeline
 * doesn't apply, so we render a simpler "closed" state instead.
 *
 * `clientStage` is only the SSR-provided initial value — the component
 * reconciles it live via SSE (`status/stream`). `stages` is static and does
 * not come from the stream.
 */
export function TrackingStatusCard({ token, clientStage: initialClientStage, stages }: TrackingStatusCardProps) {
  const [clientStage, setClientStage] = useState<ClientStage>(initialClientStage)

  useSSE<ClientStage>(`/api/quote-status/${token}/status/stream`, (data) => {
    setClientStage(data)
  })

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
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6" style={{ color: 'var(--petrol-900)' }} />
          <h2 className="text-fluid-2xl font-bold" style={{ color: 'var(--petrol-900)' }}>
            Project Status
          </h2>
        </div>
        <span
          className="px-4 py-2 rounded-full text-white text-fluid-sm font-medium"
          style={{ background: isClosed ? 'var(--petrol-900)' : '#E2C063' }}
        >
          {clientStage.label}
        </span>
      </div>

      <p className="text-fluid-base mb-8" style={{ color: 'var(--petrol-600)' }}>
        {clientStage.description}
      </p>

      {isClosed ? (
        <p className="text-fluid-sm" style={{ color: 'var(--petrol-600)', opacity: 0.7 }}>
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
                      color: isReached ? 'var(--petrol-900)' : 'var(--petrol-600)',
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
