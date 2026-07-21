'use client'

import { useEffect, useRef, useState } from 'react'
import type { FieldValues } from 'react-hook-form'
import { Loader, Paperclip, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadQuoteAttachment } from '@/presentation/lib/uploadToR2'
import { Button } from '@/presentation/design-system/components/atoms'
import { FormRenderer } from '@/presentation/components/forms/FormRenderer'
import type { FieldComponentProps, FieldComponentOverrides } from '@/presentation/components/forms/types'
import type { FormField, FormSchema } from '@/core/form-schema/FormSchema'

const FORM_SLUG = 'request-a-quote'

/**
 * Field overrides reproducing today's exact floating-label markup/classNames
 * (the `.ff-field` sibling-label CSS trick) so the public form's visual
 * output is unchanged from the pre-FormRenderer version. Each override reads
 * label/placeholder/options/help text from the `FormField` object instead of
 * hardcoding JSX, per the seeded "Request a Quote" schema.
 */

function NameFieldOverride({ field, register, error }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <input
        id={`cf-${field.id}`}
        type="text"
        placeholder=" "
        aria-invalid={!!error}
        {...register(field.id)}
      />
      <label htmlFor={`cf-${field.id}`}>{field.label}</label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

function EmailFieldOverride({ field, register, error }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <input
        id={`cf-${field.id}`}
        type="email"
        placeholder=" "
        aria-invalid={!!error}
        {...register(field.id)}
      />
      <label htmlFor={`cf-${field.id}`}>{field.label}</label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

function PhoneFieldOverride({ field, register, error }: FieldComponentProps) {
  // No aria-invalid here, matching the original block exactly — phone is the
  // one field with no validation rules, so the original never set this
  // attribute on it at all (not even aria-invalid="false").
  return (
    <div className="ff-field">
      <input id={`cf-${field.id}`} type="tel" placeholder=" " {...register(field.id)} />
      <label htmlFor={`cf-${field.id}`}>{field.label} (optional)</label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

function ServiceFieldOverride({ field, register, error }: FieldComponentProps) {
  return (
    <div className="ff-field ff-field-static">
      <select
        id={`cf-${field.id}`}
        className="contact-select"
        aria-invalid={!!error}
        {...register(field.id)}
      >
        <option value="">Select a Service</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <label htmlFor={`cf-${field.id}`}>{field.label}</label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

function MessageFieldOverride({ field, register, error }: FieldComponentProps) {
  return (
    <div className="ff-field">
      <textarea
        id={`cf-${field.id}`}
        placeholder=" "
        rows={4}
        aria-invalid={!!error}
        {...register(field.id)}
      />
      <label htmlFor={`cf-${field.id}`}>{field.label}</label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

// Consent checkbox didn't exist in the pre-FormRenderer form, so there's no
// "exact prior look" to match — styled simply, consistent with the rest of
// the form's aesthetic.
function ConsentFieldOverride({ field, register, error }: FieldComponentProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-fluid-xs" style={{ color: 'var(--contigo-foreground)' }}>
        <input
          id={`cf-${field.id}`}
          type="checkbox"
          aria-invalid={!!error}
          className="consent-checkbox mt-0.5"
          {...register(field.id)}
        />
        <span>{field.label}</span>
      </label>
      {error && <p className="text-fluid-xs text-error-600 mt-1">{error.message}</p>}
    </div>
  )
}

const fieldComponents: FieldComponentOverrides = {
  text: NameFieldOverride,
  email: EmailFieldOverride,
  phone: PhoneFieldOverride,
  select: ServiceFieldOverride,
  textarea: MessageFieldOverride,
  consent_checkbox: ConsentFieldOverride,
}

interface QuoteFormProps {
  layout?: 'section' | 'modal'
}

export function QuoteForm({ layout = 'section' }: QuoteFormProps) {
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)

  // Attachment state managed outside react-hook-form (async upload side-effect)
  const [attachmentKeys, setAttachmentKeys] = useState<string[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/forms/${FORM_SLUG}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load form')
        const result = await response.json()
        if (!cancelled) setSchema(result.schema as FormSchema)
      })
      .catch(() => {
        if (!cancelled) setSchemaError('Unable to load the form. Please refresh and try again.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (attachmentKeys.length + files.length > 3) {
      setAttachmentError('Maximum 3 images allowed')
      return
    }
    setAttachmentUploading(true)
    setAttachmentError(null)
    try {
      const uploadedKeys: string[] = []
      for (const file of files) {
        const key = await uploadQuoteAttachment(file)
        uploadedKeys.push(key)
      }
      setAttachmentKeys((prev) => [...prev, ...uploadedKeys])
    } catch {
      setAttachmentError('Failed to upload image. Please try again.')
    } finally {
      setAttachmentUploading(false)
      if (attachmentInputRef.current) attachmentInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachmentKeys((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FieldValues) => {
    if (!schema) return

    // Map FormRenderer's validated submission (keyed by field.id) onto the
    // /api/quotes request shape via each field's mapsToSystemField, rather
    // than hardcoding which field ids carry name/email/phone/service/message
    // — keeps this resilient to the seeded schema's field ids changing.
    const allFields: FormField[] = schema.steps.flatMap((step) => step.fields)
    const bySystemField: Record<string, unknown> = {}
    for (const field of allFields) {
      if (field.mapsToSystemField) {
        bySystemField[field.mapsToSystemField] = data[field.id]
      }
    }

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bySystemField.name,
          email: bySystemField.email,
          phone: bySystemField.phone,
          service: bySystemField.service,
          message: bySystemField.message,
          formData: data,
          attachmentUrls: attachmentKeys,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          result.errors.forEach((err: any) => {
            console.error(`${err.field}: ${err.message}`)
          })
        } else {
          console.error(result.message)
        }
        return
      }

      // Success: redirect to tracking page
      setAttachmentKeys([])
      router.push(`/quote-status/${result.trackingToken}`)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <div className={`contact-form-wrapper${layout === 'modal' ? ' contact-form-wrapper--modal' : ''}`}>
      {/* Blobs layer: soft CSS-blurred gold orbs (GPU-composited, no SVG filter) */}
      <div className="gooey-blobs-layer" aria-hidden="true">
        <div className="gooey-blob blob-1" />
        <div className="gooey-blob blob-2" />
        <div className="gooey-blob blob-3" />
      </div>

      {/* Form overlay: composites independently, no filter overhead */}
      <div className="form-overlay">
        {schemaError && (
          <p className="text-fluid-xs text-error-600 mt-1">{schemaError}</p>
        )}

        {schema && (
          <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            fieldComponents={fieldComponents}
            className="contact-form flex flex-col gap-3.5"
            beforeFields={<span className="form-overline">Request a Quote</span>}
          >
            {({ isSubmitting }) => (
              <>
                {/* Attachment upload (optional, up to 3 images) — sidecar
                    feature outside the form schema, rendered inside the same
                    <form> so the submit button stays last, but managed
                    entirely by this wrapper's own state/handlers. */}
                <div>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                    aria-label="Attach project images"
                  />
                  <div className="attach-file-list">
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={attachmentUploading || attachmentKeys.length >= 3}
                      className="attach-btn"
                    >
                      {attachmentUploading ? (
                        <Loader className="w-[clamp(0.75rem,1.2vw,0.875rem)] h-[clamp(0.75rem,1.2vw,0.875rem)] animate-spin" />
                      ) : (
                        <Paperclip className="w-[clamp(0.75rem,1.2vw,0.875rem)] h-[clamp(0.75rem,1.2vw,0.875rem)]" />
                      )}
                      {attachmentUploading
                        ? 'Uploading…'
                        : attachmentKeys.length >= 3
                          ? 'Max 3 images reached'
                          : `Attach Images (${attachmentKeys.length}/3)`}
                    </button>

                    {attachmentKeys.map((key, i) => (
                      <div key={i} className="attach-file-item">
                        <span>{key.split('/').pop()}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="attach-remove-btn"
                          aria-label="Remove attachment"
                        >
                          <X className="w-[clamp(0.6875rem,1vw,0.8125rem)] h-[clamp(0.6875rem,1vw,0.8125rem)]" />
                        </button>
                      </div>
                    ))}

                    {attachmentError && (
                      <span className="text-fluid-xs" style={{ color: 'var(--error-600)' }}>
                        {attachmentError}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || attachmentUploading}
                  variant="primary"
                  size="lg"
                  className="w-full contact-submit-btn"
                  style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
                >
                  {isSubmitting && (
                    <Loader className="w-[clamp(0.875rem,1.4vw,1rem)] h-[clamp(0.875rem,1.4vw,1rem)] animate-spin" />
                  )}
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                </Button>
              </>
            )}
          </FormRenderer>
        )}
      </div>
    </div>
  )
}
