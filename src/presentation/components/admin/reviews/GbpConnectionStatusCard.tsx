'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/presentation/components/ui/badge'
import type { GbpConnectionStatus } from '@/core/entities/GbpConnection'

interface StatusResponse {
  status: GbpConnectionStatus
  checkedAt: string
  detail?: string
}

const STATUS_META: Record<
  GbpConnectionStatus,
  { label: string; tone: 'green' | 'amber' | 'lightAmber' | 'red' | 'gray'; message: string }
> = {
  pending_api_approval: {
    label: 'Approval pending',
    tone: 'amber',
    message:
      'Google approval pending — our API access request is under review by Google. Sync will start automatically once approved.',
  },
  auth_error: {
    label: 'Reconnect required',
    tone: 'red',
    message: 'Google connection expired or revoked. Please reconnect.',
  },
  connected: {
    label: 'Connected',
    tone: 'green',
    message: 'Connected to Google Business Profile.',
  },
  rate_limited: {
    label: 'Rate limited',
    tone: 'lightAmber',
    message: 'Temporarily rate limited by Google — retrying automatically.',
  },
  disconnected: {
    label: 'Not connected',
    tone: 'gray',
    message: 'Not connected.',
  },
  error: {
    label: 'Check failed',
    tone: 'red',
    message: 'Connection check failed.',
  },
}

const TONE_STYLE: Record<(typeof STATUS_META)[GbpConnectionStatus]['tone'], { bg: string; color: string }> = {
  green: { bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
  amber: { bg: 'rgba(217,119,6,0.14)', color: '#B45309' },
  lightAmber: { bg: 'rgba(217,119,6,0.08)', color: '#B45309' },
  red: { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' },
  gray: { bg: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

// No self-service reconnect flow exists today (tokens are static env vars,
// rotated manually in infra — see plan §0.3 finding). Rather than a button
// with nowhere real to go, auth_error/disconnected get instructional text.
const REMEDIATION_HINT: Partial<Record<GbpConnectionStatus, string>> = {
  auth_error: 'Rotate GOOGLE_REFRESH_TOKEN in the deployment environment and redeploy.',
  disconnected: 'Configure the GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / GOOGLE_LOCATION_ID environment variables.',
}

export function GbpConnectionStatusCard() {
  const [state, setState] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async (forceRefresh: boolean) => {
    forceRefresh ? setChecking(true) : setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/gbp/connection-status${forceRefresh ? '?refresh=1' : ''}`)
      if (!res.ok) throw new Error('Request failed')
      const data: StatusResponse = await res.json()
      setState(data)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, resolved asynchronously inside `load`
    load(false)
  }, [load])

  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
      <div className="flex items-center justify-between">
        <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
          Google Business Profile — live connection status
        </p>
        {state && (
          <Badge style={{ backgroundColor: TONE_STYLE[STATUS_META[state.status].tone].bg, color: TONE_STYLE[STATUS_META[state.status].tone].color }}>
            {STATUS_META[state.status].label}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="mt-2 h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'rgba(107,101,96,0.15)' }} />
      ) : loadError ? (
        <p className="text-fluid-xs mt-2" style={{ color: '#dc2626' }}>
          Could not load connection status.
        </p>
      ) : state ? (
        <>
          <p className="text-fluid-xs mt-1.5" style={{ color: 'var(--neutral-600)' }}>
            {STATUS_META[state.status].message}
          </p>
          {REMEDIATION_HINT[state.status] && (
            <p className="text-fluid-xs mt-1" style={{ color: 'var(--neutral-600)', fontStyle: 'italic' }}>
              {REMEDIATION_HINT[state.status]}
            </p>
          )}
          {state.detail && state.status === 'error' && (
            <p className="text-fluid-xs mt-1" style={{ color: 'var(--neutral-600)' }}>
              {state.detail}
            </p>
          )}
          <p className="text-fluid-xs mt-2" style={{ color: 'var(--neutral-400)' }}>
            Last checked: {new Date(state.checkedAt).toLocaleString()}
          </p>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => load(true)}
        disabled={checking || loading}
        className="mt-3 px-4 py-1.5 rounded-lg text-fluid-xs font-medium transition-all disabled:opacity-50"
        style={{ border: '1px solid rgba(226,192,99,0.4)', color: 'var(--contigo-primary)', backgroundColor: 'rgba(226,192,99,0.08)' }}
      >
        {checking ? 'Checking…' : 'Check again'}
      </button>
    </div>
  )
}
