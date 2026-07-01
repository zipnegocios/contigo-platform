'use client'

import { useState } from 'react'
import { X, CheckCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { FormVersionSummary } from '@/core/repositories/IFormRepository'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  versions: FormVersionSummary[]
  onRevert: () => void
}

export function FormVersionsDrawer({ open, onClose, slug, versions, onRevert }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [reverting, setReverting] = useState(false)

  async function handleRevert(versionId: string, versionN: number) {
    setReverting(true)
    try {
      const res = await fetch(`/api/admin/forms/${slug}/versions/${versionId}/revert`, {
        method: 'POST',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? 'Failed to revert')
        return
      }
      toast.success(`Restored to Version ${versionN}`)
      setConfirmingId(null)
      onRevert()
      onClose()
    } catch {
      toast.error('Failed to revert')
    } finally {
      setReverting(false)
    }
  }

  function formatDate(d: Date | string) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d))
  }

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 39,
            background: 'rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 52,
          bottom: 0,
          width: 320,
          zIndex: 40,
          background: '#1E1A16',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={15} style={{ color: '#E2C063' }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>
              Version History
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Version list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {versions.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
              No versions yet.
            </p>
          ) : (
            versions.map((v) => {
              const isConfirming = confirmingId === v.id
              return (
                <div
                  key={v.id}
                  style={{
                    background: v.isActive ? 'rgba(226,192,99,0.1)' : 'rgba(255,255,255,0.04)',
                    border: v.isActive ? '1px solid rgba(226,192,99,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    padding: '0.75rem',
                    marginBottom: 6,
                  }}
                >
                  {/* Row header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                        Version {v.version}
                      </span>
                      {v.isActive && (
                        <span
                          style={{
                            background: '#E2C063',
                            color: '#2D2924',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            borderRadius: 10,
                            padding: '1px 7px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <CheckCircle size={8} /> Current
                        </span>
                      )}
                    </div>
                    {!v.isActive && !isConfirming && (
                      <button
                        onClick={() => setConfirmingId(v.id)}
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 5,
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.7rem',
                          padding: '3px 9px',
                          cursor: 'pointer',
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </div>

                  {/* Meta */}
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: isConfirming ? 8 : 0 }}>
                    {formatDate(v.createdAt)} · {v.fieldCount} field{v.fieldCount !== 1 ? 's' : ''}
                  </p>

                  {/* Inline confirm */}
                  {isConfirming && (
                    <div
                      style={{
                        background: 'rgba(226,192,99,0.07)',
                        border: '1px solid rgba(226,192,99,0.2)',
                        borderRadius: 6,
                        padding: '0.6rem',
                        marginTop: 6,
                      }}
                    >
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', marginBottom: 8, fontWeight: 600 }}>
                        Restore Version {v.version}?
                      </p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setConfirmingId(null)}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 5,
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.75rem',
                            padding: '4px 0',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRevert(v.id, v.version)}
                          disabled={reverting}
                          style={{
                            flex: 1,
                            background: '#E2C063',
                            border: 'none',
                            borderRadius: 5,
                            color: '#2D2924',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 0',
                            cursor: reverting ? 'default' : 'pointer',
                            opacity: reverting ? 0.7 : 1,
                          }}
                        >
                          {reverting ? 'Restoring…' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
