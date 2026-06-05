'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Phone, Mail, MapPin, Clock, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInput>({
    resolver: zodResolver(ContactFormSchema),
  })

  const onSubmit = async (data: ContactFormInput) => {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      style={{ backgroundColor: 'var(--heritage-sand)' }}
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
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Your Name"
                    />
                    {errors.name && (
                      <span className="error-text" style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Email Address"
                    />
                    {errors.email && (
                      <span className="error-text" style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="Phone Number (optional)"
                    />
                    {errors.phone && (
                      <span className="error-text" style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {errors.phone.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <select {...register('service')}>
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
                      <span className="error-text" style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {errors.service.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <textarea
                      {...register('message')}
                      placeholder="Tell us about your project..."
                      rows={4}
                    />
                    {errors.message && (
                      <span className="error-text" style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {errors.message.message}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isSubmitting && <Loader size={16} className="animate-spin" />}
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
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
              style={{ color: 'var(--heritage-charcoal)' }}
            >
              Start Your Project
            </h2>
            <p
              className="mb-8 text-base"
              style={{
                color: 'var(--heritage-charcoal)',
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
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Phone
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
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
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Email
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
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
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Address
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
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
                    style={{ color: 'var(--heritage-charcoal)' }}
                  >
                    Business Hours
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--heritage-charcoal)', opacity: 0.7 }}
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
