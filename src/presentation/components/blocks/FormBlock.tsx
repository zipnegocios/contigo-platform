'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormBlockData } from '@/types/pageBlocks'
import type { FormSchema } from '@/core/form-schema/FormSchema'

interface Props {
  data: FormBlockData
}

function InlineForm({ schema, formSlug }: { schema: FormSchema; formSlug: string }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fields = schema.steps[0]?.fields ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const body: Record<string, string> = {}
      for (const field of fields) {
        if (field.mapsToSystemField) {
          body[field.mapsToSystemField] = values[field.id] ?? ''
        }
      }
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, formSlug }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: '2rem',
          background: 'rgba(226,192,99,0.08)',
          border: '1px solid rgba(226,192,99,0.3)',
          borderRadius: 10,
          textAlign: 'center',
          color: '#2D2924',
        }}
      >
        <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Thank you!</p>
        <p style={{ fontSize: '0.875rem', color: '#6B6560' }}>
          Your submission has been received. We&apos;ll be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {fields.map((field) => {
        if (['submit_button', 'next_button', 'heading_block', 'divider', 'spacer'].includes(field.type)) {
          return null
        }
        const isConsent = ['checkbox', 'consent_checkbox', 'terms_acceptance'].includes(field.type)
        return (
          <div key={field.id}>
            {!isConsent && (
              <label
                style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2D2924', marginBottom: 4 }}
              >
                {field.label}
                {field.required && <span style={{ color: '#e87070', marginLeft: 3 }}>*</span>}
              </label>
            )}
            {isConsent ? (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#2D2924', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  required={field.required}
                  checked={values[field.id] === 'true'}
                  onChange={(e) => setValues((p) => ({ ...p, [field.id]: e.target.checked ? 'true' : '' }))}
                  style={{ marginTop: 3, accentColor: '#E2C063', flexShrink: 0 }}
                />
                <span>{field.label}{field.required && <span style={{ color: '#e87070', marginLeft: 3 }}>*</span>}</span>
              </label>
            ) : field.type === 'textarea' || field.type === 'rich_text' ? (
              <textarea
                rows={4}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => setValues((p) => ({ ...p, [field.id]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #E5DDD0',
                  borderRadius: 7,
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            ) : field.type === 'select' ? (
              <select
                required={field.required}
                value={values[field.id] ?? ''}
                onChange={(e) => setValues((p) => ({ ...p, [field.id]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #E5DDD0',
                  borderRadius: 7,
                  fontSize: '0.875rem',
                  background: '#fafafa',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => setValues((p) => ({ ...p, [field.id]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #E5DDD0',
                  borderRadius: 7,
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            )}
            {field.helpText && (
              <p style={{ fontSize: '0.72rem', color: '#6B6560', marginTop: 3 }}>{field.helpText}</p>
            )}
          </div>
        )
      })}

      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.8rem', background: '#FFF5F5', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          background: '#E2C063',
          color: '#2D2924',
          border: 'none',
          borderRadius: 8,
          padding: '0.75rem 2rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: submitting ? 'default' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}

export function FormBlock({ data }: Props) {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    fetch(`/api/forms/${data.formSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.schema) setSchema(json.schema)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [data.formSlug])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (modalOpen) d.showModal()
    else d.close()
  }, [modalOpen])

  if (loading) {
    return (
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: '#F5EFE8', borderRadius: 8, height: 200 }} />
      </section>
    )
  }

  if (!schema) return null

  if (data.displayMode === 'modal') {
    const isPrimary = data.buttonStyle === 'primary'
    return (
      <section style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: isPrimary ? '#E2C063' : 'transparent',
            color: isPrimary ? '#2D2924' : '#2D2924',
            border: isPrimary ? 'none' : '2px solid #2D2924',
            borderRadius: 8,
            padding: '0.75rem 2.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          {data.buttonLabel}
        </button>
        <dialog
          ref={dialogRef}
          style={{
            border: 'none',
            borderRadius: 14,
            padding: '2rem',
            width: '100%',
            maxWidth: 560,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => { if (e.target === dialogRef.current) setModalOpen(false) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', fontWeight: 700, color: '#2D2924', margin: 0 }}>
              {data.buttonLabel}
            </h2>
            <button
              onClick={() => setModalOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6B6560', padding: 4 }}
            >
              ✕
            </button>
          </div>
          <InlineForm schema={schema} formSlug={data.formSlug} />
        </dialog>
      </section>
    )
  }

  return (
    <section style={{ padding: '4rem 2rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <InlineForm schema={schema} formSlug={data.formSlug} />
      </div>
    </section>
  )
}
