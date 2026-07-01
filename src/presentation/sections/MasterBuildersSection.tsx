'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/presentation/components/ui/dialog'

type Benefit = {
  title: string
  body: string
  icon: React.ReactNode
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const BENEFITS: Benefit[] = [
  {
    title: 'Independently vetted',
    body: 'Every member must prove valid licensing, financial stability, and a clean track record before being admitted. You are not hiring an unknown.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: 'Fair, transparent contracts',
    body: 'We build on Master Builders contracts drafted by construction-law experts, with clear progress payments and variations that meet consumer-protection law.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Dispute protection',
    body: 'If a disagreement arises, Master Builders can mediate independently — resolving matters before they ever reach a tribunal, saving time and money for both sides.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M8 7l-3 6a3 3 0 0 0 6 0z" />
        <path d="M16 7l3 6a3 3 0 0 1-6 0z" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    title: 'A guaranteed standard',
    body: 'Members are bound by a strict Code of Conduct. Substandard work puts membership at risk — so the incentive is always excellence.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <circle cx="12" cy="9" r="6" />
        <polyline points="8.5 13.5 7 22 12 19 17 22 15.5 13.5" />
      </svg>
    ),
  },
]

export default function MasterBuildersSection() {
  const [open, setOpen] = useState(false)
  const cardRef = useScrollReveal<HTMLDivElement>({ y: 28, duration: 0.9, start: 'top 80%' })

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-50)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          ref={cardRef}
          className="mba-card"
          style={{ padding: 'clamp(1.75rem, 4vw, 3rem)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-center">
            {/* Logo plaque */}
            <div
              className="flex items-center justify-center mx-auto md:mx-0"
              style={{
                backgroundColor: 'var(--neutral-50)',
                borderRadius: 16,
                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                width: 'clamp(150px, 40vw, 190px)',
                boxShadow: '0 10px 30px -12px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src="/assets/logos/master-builders.png"
                alt="Master Builders Member"
                width={190}
                height={205}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>

            {/* Copy */}
            <div className="text-center md:text-left">
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-400)',
                  marginBottom: '0.75rem',
                }}
              >
                Accredited Membership
              </span>
              <h2
                className="text-fluid-2xl md:text-fluid-3xl"
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  color: 'var(--neutral-50)',
                  lineHeight: 1.15,
                  marginBottom: '0.9rem',
                }}
              >
                A Member of Master Builders Australia
              </h2>
              <p
                className="text-fluid-base"
                style={{
                  color: 'rgba(250, 246, 240, 0.78)',
                  lineHeight: 1.6,
                  maxWidth: '38rem',
                  marginBottom: '1.6rem',
                }}
              >
                Contigo Constructions is an accredited member of Master Builders Australia — the
                nation&rsquo;s peak building body since 1873. Independent proof that our licensing,
                finances, and craftsmanship are held to the industry&rsquo;s highest standard.
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 group"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--gold-400)',
                  border: '1px solid var(--gold-a30)',
                  borderRadius: 8,
                  padding: '0.7rem 1.4rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gold-a12)'
                  e.currentTarget.style.borderColor = 'var(--gold-400)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--gold-a30)'
                }}
              >
                See why it matters
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl border-0 bg-transparent p-0 shadow-none overflow-visible"
        >
        <div className="relative">
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--gold-400)',
                color: '#1E1A16',
                boxShadow: '0 6px 18px -4px rgba(0,0,0,0.35)',
              }}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </DialogClose>

          <div
            className="modal-scroll-panel max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--neutral-50)',
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.4)',
            }}
          >
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))' }} />
          <div style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
            <DialogHeader>
              <DialogTitle asChild>
                <h3
                  style={{
                    fontFamily: 'var(--font-alegreya)',
                    fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
                    lineHeight: 1.2,
                    color: 'var(--petrol-800)',
                    fontWeight: 600,
                  }}
                >
                  What Master Builders membership means for you
                </h3>
              </DialogTitle>
              <DialogDescription asChild>
                <p
                  style={{
                    fontFamily: 'var(--font-alegreya-sans)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: 'var(--neutral-500)',
                    marginTop: '0.4rem',
                  }}
                >
                  Membership is a voluntary mark of quality, ethics, and professionalism — and it
                  works in your favour long before the first brick is laid.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-3.5">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      backgroundColor: 'var(--gold-a12)',
                      color: 'var(--gold-600)',
                    }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-alegreya-sans)',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--petrol-800)',
                        marginBottom: '0.2rem',
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}
                    >
                      {b.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: 'var(--font-alegreya-sans)',
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: 'var(--neutral-500)',
                      }}
                    >
                      {b.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-7 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ borderTop: '1px solid var(--gold-a15)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-alegreya-sans)',
                  fontSize: '0.85rem',
                  color: 'var(--neutral-500)',
                  maxWidth: '26rem',
                }}
              >
                For you, it is a safety filter that dramatically lowers the risk of a poor
                build — and the peace of mind that comes with it.
              </p>
              <a
                href="/#contact"
                onClick={() => setOpen(false)}
                className="btn-primary"
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Start your project
              </a>
            </div>
          </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
