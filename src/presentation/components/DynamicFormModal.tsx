'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FieldValues } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { FormRenderer } from '@/presentation/components/forms/FormRenderer'
import type { FormSchema, FormField } from '@/core/form-schema/FormSchema'

interface Props {
  slug: string | null
  formName?: string
  open: boolean
  onClose: () => void
}

export function DynamicFormModal({ slug, formName, open, onClose }: Props) {
  const router = useRouter()
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [formVersionId, setFormVersionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open || !slug) {
      setSchema(null)
      setFormVersionId(null)
      setError(null)
      setSubmitted(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/forms/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Form not found')
        const data = await res.json()
        if (!cancelled) {
          setSchema(data.schema as FormSchema)
          setFormVersionId(data.formVersionId ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load the form. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [open, slug])

  async function handleSubmit(data: FieldValues) {
    if (!schema) return
    const allFields: FormField[] = schema.steps.flatMap((step) => step.fields)
    const bySystemField: Record<string, unknown> = {}
    for (const field of allFields) {
      if (field.mapsToSystemField) {
        bySystemField[field.mapsToSystemField] = data[field.id]
      }
    }

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bySystemField.name,
          email: bySystemField.email,
          phone: bySystemField.phone ?? '',
          service: bySystemField.service ?? formName ?? '',
          message: bySystemField.message ?? '',
          formVersionId,
          formData: data,
          attachmentUrls: [],
        }),
      })
      const result = await res.json()
      if (res.ok && result.trackingToken) {
        onClose()
        router.push(`/quote-status/${result.trackingToken}`)
      } else {
        setSubmitted(true)
      }
    } catch {
      setSubmitted(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--contigo-background)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-fluid-2xl font-cormorant font-bold"
            style={{ color: 'var(--contigo-foreground)' }}
          >
            {formName ?? 'Contact Us'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B6560', fontSize: '0.875rem' }}>
            Loading form…
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', color: '#c0392b', fontSize: '0.875rem' }}>{error}</div>
        )}

        {submitted && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2D2924', marginBottom: 8 }}>Thank you!</p>
            <p style={{ fontSize: '0.875rem', color: '#6B6560' }}>We received your message and will be in touch soon.</p>
          </div>
        )}

        {!loading && !error && !submitted && schema && (
          <div className="contact-form-wrapper">
            <FormRenderer schema={schema} onSubmit={handleSubmit} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
