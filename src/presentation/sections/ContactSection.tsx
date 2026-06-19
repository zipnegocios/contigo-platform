'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { QuoteForm } from '@/presentation/components/QuoteForm'
import { ContactDetails } from '@/presentation/components/ContactDetails'

export default function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)

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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column - Gooey Form */}
          <div ref={leftColRef} className="lg:w-1/2">
            <QuoteForm />
          </div>

          {/* Right Column - Contact Info */}
          <div ref={rightColRef} className="lg:w-1/2 flex flex-col justify-center">
            <span
              className="label block mb-4"
              style={{ color: 'var(--contigo-primary)' }}
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
              className="mb-8 text-fluid-base"
              style={{
                color: 'var(--contigo-foreground)',
                opacity: 0.8,
                lineHeight: 1.7,
              }}
            >
              Ready to build? Contact us for a free consultation and quote. Our
              team is here to help bring your vision to life.
            </p>

            <ContactDetails />
          </div>
        </div>
      </div>

      {/* CC Monogram watermark */}
      <div className="absolute bottom-8 right-8 pointer-events-none hidden lg:block" style={{ opacity: 0.15 }}>
        <Image
          src="/assets/isotipo.png"
          alt=""
          width={200}
          height={200}
          style={{ width: '200px', height: 'auto' }}
        />
      </div>
    </section>
  )
}
