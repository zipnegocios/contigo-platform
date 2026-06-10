'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Phone, Mail, MapPin, Clock, Loader, Paperclip, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadQuoteAttachment } from '@/presentation/lib/uploadToR2'
import { FormField } from '@/presentation/design-system/components/molecules'
import { Button } from '@/presentation/design-system/components/atoms'

gsap.registerPlugin(ScrollTrigger)

const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  service: z.string().min(1, 'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormInput = z.infer<typeof ContactFormSchema>

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftColRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })

      gsap.from(rightColRef.current, {
        x: 30,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section-gap page-padding relative"
      style={{ backgroundColor: 'var(--neutral-50)' }}
    >
      {/* SVG Filter for Gooey Effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column - Gooey Form */}
          <div ref={leftColRef} className="lg:w-1/2">
            <div className="gooey-container">
              <div className="gooey-blob blob-1" />
              <div className="gooey-blob blob-2" />
              <div className="gooey-blob blob-3" />
              <div className="form-overlay">
                <form onSubmit={handleSubmit(onSubmit)} className="contact-form">
                  <div className="form-group">
                    <FormField
                      {...register('name')}
                      type="text"
                      placeholder="Your Name"
                      error={errors.name?.message}
                    />
                  </div>

                  <div className="form-group">
                    <FormField
                      {...register('email')}
                      type="email"
                      placeholder="Email Address"
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="form-group">
                    <FormField
                      {...register('phone')}
                      type="tel"
                      placeholder="Phone Number (optional)"
                      error={errors.phone?.message}
                    />
                  </div>

                  <div className="form-group">
                    <div className="w-full space-y-1.5">
                      <select
                        {...register('service')}
                        className={`flex h-10 w-full rounded-lg border bg-contigo-background px-3 py-2 text-sm placeholder:text-contigo-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          errors.service
                            ? 'border-error-600 focus:ring-error-600'
                            : 'border-contigo-border focus:ring-contigo-primary'
                        }`}
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
                      {errors.service && (
                        <p className="text-xs text-error-600">{errors.service.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="w-full space-y-1.5">
                      <textarea
                        {...register('message')}
                        placeholder="Tell us about your project..."
                        rows={4}
                        className={`flex w-full rounded-lg border bg-contigo-background px-3 py-2 text-sm placeholder:text-contigo-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          errors.message
                            ? 'border-error-600 focus:ring-error-600'
                            : 'border-contigo-border focus:ring-contigo-primary'
                        }`}
                      />
                      {errors.message && (
                        <p className="text-xs text-error-600">{errors.message.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Attachment upload (optional, up to 3 images) */}
                  <div className="form-group">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleAttachmentChange}
                      className="hidden"
                      aria-label="Attach project images"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={attachmentUploading || attachmentKeys.length >= 3}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          border: '1px dashed rgba(226,192,99,0.5)',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '13px',
                          cursor: attachmentUploading || attachmentKeys.length >= 3 ? 'not-allowed' : 'pointer',
                          width: '100%',
                          justifyContent: 'center',
                          opacity: attachmentKeys.length >= 3 ? 0.5 : 1,
                        }}
                      >
                        {attachmentUploading ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Paperclip size={14} />
                        )}
                        {attachmentUploading
                          ? 'Uploading…'
                          : attachmentKeys.length >= 3
                            ? 'Max 3 images'
                            : `Attach Images (${attachmentKeys.length}/3)`}
                      </button>

                      {/* Attached file list */}
                      {attachmentKeys.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {attachmentKeys.map((key, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(226,192,99,0.1)',
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.8)',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                {key.split('/').pop()}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(i)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {attachmentError && (
                        <span style={{ fontSize: '12px', color: 'var(--error-600)' }}>{attachmentError}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || attachmentUploading}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {isSubmitting && <Loader size={16} className="animate-spin" />}
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div ref={rightColRef} className="lg:w-1/2 flex flex-col justify-center">
            <span
              className="label block mb-4"
              style={{ color: 'var(--heritage-terracotta)' }}
            >
              GET IN TOUCH
            </span>
            <h2
              className="mb-6"
              style={{ color: 'var(--contigo-foreground)' }}
            >
              Start Your Project
            </h2>
            <p
              className="mb-8 text-base"
              style={{
                color: 'var(--contigo-foreground)',
                opacity: 0.8,
                lineHeight: 1.7,
              }}
            >
              Ready to build? Contact us for a free consultation and quote. Our
              team is here to help bring your vision to life.
            </p>

            {/* Contact Details */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Phone
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--contigo-foreground)' }}
                  >
                    Phone
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}
                  >
                    (08) 8123 4567
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--contigo-foreground)' }}
                  >
                    Email
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}
                  >
                    info@contigoconstructions.com.au
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--contigo-foreground)' }}
                  >
                    Address
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}
                  >
                    25 Green Avenue, Seaton SA 5023
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock
                  size={20}
                  style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--contigo-foreground)' }}
                  >
                    Business Hours
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--contigo-foreground)', opacity: 0.7 }}
                  >
                    Mon - Fri: 7:00 AM - 5:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CC Monogram watermark */}
      <img
        src="/assets/isotipo.png"
        alt=""
        className="absolute bottom-8 right-8 pointer-events-none hidden lg:block"
        style={{ width: '200px', opacity: 0.15 }}
      />
    </section>
  )
}
