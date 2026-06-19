'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader, Paperclip, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadQuoteAttachment } from '@/presentation/lib/uploadToR2'
import { Button } from '@/presentation/design-system/components/atoms'

const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  service: z.string().min(1, 'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormInput = z.infer<typeof ContactFormSchema>

export function QuoteForm() {
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Attachment state managed outside react-hook-form (async upload side-effect)
  const [attachmentKeys, setAttachmentKeys] = useState<string[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInput>({
    resolver: zodResolver(ContactFormSchema),
  })

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

  const onSubmit = async (data: ContactFormInput) => {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attachmentUrls: attachmentKeys }),
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
      reset()
      setAttachmentKeys([])
      router.push(`/quote-status/${result.trackingToken}`)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <div className="contact-form-wrapper">
      {/* Blobs layer: soft CSS-blurred gold orbs (GPU-composited, no SVG filter) */}
      <div className="gooey-blobs-layer" aria-hidden="true">
        <div className="gooey-blob blob-1" />
        <div className="gooey-blob blob-2" />
        <div className="gooey-blob blob-3" />
      </div>

      {/* Form overlay: composites independently, no filter overhead */}
      <div className="form-overlay">
        <form onSubmit={handleSubmit(onSubmit)} className="contact-form flex flex-col gap-5">
          <span className="form-overline">Request a Quote</span>

          <div className="ff-field">
            <input
              id="cf-name"
              type="text"
              placeholder=" "
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            <label htmlFor="cf-name">Your Name</label>
            {errors.name && (
              <p className="text-fluid-xs text-error-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="ff-field">
            <input
              id="cf-email"
              type="email"
              placeholder=" "
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            <label htmlFor="cf-email">Email Address</label>
            {errors.email && (
              <p className="text-fluid-xs text-error-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="ff-field">
            <input
              id="cf-phone"
              type="tel"
              placeholder=" "
              {...register('phone')}
            />
            <label htmlFor="cf-phone">Phone Number (optional)</label>
          </div>

          <div className="ff-field ff-field-static">
            <select
              id="cf-service"
              className="contact-select"
              aria-invalid={!!errors.service}
              {...register('service')}
            >
              <option value="">Select a Service</option>
              <option value="New Home Building">New Home Building</option>
              <option value="Home Extensions">Home Extensions</option>
              <option value="Home Renovations">Home Renovations</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Cladding">Cladding</option>
              <option value="Painting">Painting</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Other">Other</option>
            </select>
            <label htmlFor="cf-service">Service</label>
            {errors.service && (
              <p className="text-fluid-xs text-error-600 mt-1">{errors.service.message}</p>
            )}
          </div>

          <div className="ff-field">
            <textarea
              id="cf-message"
              placeholder=" "
              rows={4}
              aria-invalid={!!errors.message}
              {...register('message')}
            />
            <label htmlFor="cf-message">Tell us about your project</label>
            {errors.message && (
              <p className="text-fluid-xs text-error-600 mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Attachment upload (optional, up to 3 images) */}
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
          >
            {isSubmitting && (
              <Loader className="w-[clamp(0.875rem,1.4vw,1rem)] h-[clamp(0.875rem,1.4vw,1rem)] animate-spin" />
            )}
            {isSubmitting ? 'Sending…' : 'Send Message'}
          </Button>
        </form>
      </div>
    </div>
  )
}
