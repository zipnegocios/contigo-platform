'use client'

import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

export default function OurStorySection() {
  const headingRef = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const beat1Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const beat2Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const beat3Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const quote1Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const beat4Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })
  const quote2Ref = useScrollReveal<HTMLDivElement>({ y: 24, duration: 0.8 })

  const paragraphStyle = {
    color: 'var(--contigo-foreground)',
    opacity: 0.82,
    lineHeight: 1.7,
  } as const

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-50)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <div ref={headingRef}>
          <span
            className="block text-fluid-xs uppercase tracking-widest mb-5"
            style={{ color: 'var(--petrol-600)' }}
          >
            The Beginning
          </span>
          <h2 style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--contigo-foreground)' }}>
            We build more than projects. We build the place where your story begins.
          </h2>
        </div>

        <div ref={beat1Ref} className="flex flex-col gap-5">
          <p className="text-fluid-lg" style={paragraphStyle}>
            At Contigo Constructions, we believe a home is much more than walls and a roof.
            It&apos;s where families grow, milestones are celebrated, and lifelong memories are
            created.
          </p>
          <p className="text-fluid-lg" style={paragraphStyle}>
            That&apos;s why our work doesn&apos;t begin with timber, steel, or tools. It begins
            by listening.
          </p>
        </div>

        <p ref={beat2Ref} className="text-fluid-lg" style={paragraphStyle}>
          Behind every pergola, deck, renovation, extension, or carpentry project is a dream, a
          vision, and a family looking to create a space they truly love. Our role is to bring
          that vision to life with quality craftsmanship, honest communication, and genuine care.
        </p>

        <p ref={beat3Ref} className="text-fluid-lg" style={paragraphStyle}>
          We don&apos;t believe in simply completing a job and moving on. We believe in building
          lasting relationships based on trust, transparency, and collaboration. From our first
          conversation to the final walkthrough, we work closely with our clients to ensure every
          detail reflects their vision and every decision adds value to their home.
        </p>

        <div ref={quote1Ref} className="text-center py-4">
          <div className="gold-rule mx-auto mb-8" />
          <p
            className="italic text-fluid-xl md:text-fluid-2xl"
            style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--petrol-600)', lineHeight: 1.5 }}
          >
            Every project is unique because every family is unique.
          </p>
          <p className="text-fluid-base mt-6" style={paragraphStyle}>
            That&apos;s why we pay attention to the details that matter most — because we know
            those details are what transform a house into a home.
          </p>
          <div className="gold-rule mx-auto mt-8" />
        </div>

        <p ref={beat4Ref} className="text-fluid-lg" style={paragraphStyle}>
          At Contigo Constructions, we don&apos;t just build structures. We create spaces where
          families will gather for dinner, children will grow up, friends will celebrate, and
          memories will be made for years to come.
        </p>

        <div ref={quote2Ref} className="text-center pt-6">
          <p
            className="italic text-fluid-xl md:text-fluid-2xl"
            style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--contigo-foreground)', lineHeight: 1.5 }}
          >
            At the end of every project, our greatest achievement isn&apos;t simply completing
            the construction. It&apos;s knowing we&apos;ve helped build the place where{' '}
            <span style={{ color: 'var(--petrol-600)', fontStyle: 'normal' }}>
              a new chapter of someone&apos;s life begins
            </span>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
