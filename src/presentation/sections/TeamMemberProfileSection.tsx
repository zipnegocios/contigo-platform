'use client'

import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

type TeamMemberProfileSectionProps = {
  sectionLabel: string
  name: string
  role: string
  photoSrc: string
  photoAlt: string
  paragraphs: string[]
  quote: string
  imageSide: 'left' | 'right'
  background: 'dark' | 'light'
}

export default function TeamMemberProfileSection({
  sectionLabel,
  name,
  role,
  photoSrc,
  photoAlt,
  paragraphs,
  quote,
  imageSide,
  background,
}: TeamMemberProfileSectionProps) {
  const imageRef = useScrollReveal<HTMLDivElement>({ y: 32, duration: 0.9 })
  const textRef = useScrollReveal<HTMLDivElement>({
    y: 24,
    duration: 0.8,
    stagger: 0.15,
    delay: 0.1,
    childSelector: '.profile-block',
  })

  const isDark = background === 'dark'
  const sectionBg = isDark ? 'var(--petrol-800)' : 'var(--neutral-50)'
  const headingColor = isDark ? 'var(--neutral-50)' : 'var(--contigo-foreground)'
  const accentColor = isDark ? 'var(--gold-400)' : 'var(--petrol-600)'
  const bodyColor = isDark ? 'rgba(250,246,240,0.78)' : 'var(--contigo-foreground)'
  const bodyOpacity = isDark ? 1 : 0.82
  const imageOrder = imageSide === 'right' ? 'lg:order-2' : 'lg:order-1'
  const textOrder = imageSide === 'right' ? 'lg:order-1' : 'lg:order-2'

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: sectionBg, fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div ref={imageRef} className={`lg:col-span-5 ${imageOrder}`}>
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ aspectRatio: '4 / 5', boxShadow: '0 16px 48px rgba(45,41,36,0.18)' }}
          >
            <img
              src={photoSrc}
              alt={photoAlt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(13,60,76,0.35) 0%, transparent 50%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: 'var(--gold-400)' }}
            />
          </div>
        </div>

        <div ref={textRef} className={`lg:col-span-7 flex flex-col gap-6 ${textOrder}`}>
          <div className="profile-block">
            <span
              className="block text-fluid-xs uppercase tracking-widest mb-4"
              style={{ color: accentColor }}
            >
              {sectionLabel}
            </span>
            <h2 style={{ fontFamily: 'var(--font-alegreya)', color: headingColor }}>{name}</h2>
            <p
              className="text-fluid-sm uppercase tracking-wide mt-2"
              style={{ color: accentColor, letterSpacing: '0.06em' }}
            >
              {role}
            </p>
          </div>

          <div className="profile-block flex flex-col gap-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-fluid-base"
                style={{ color: bodyColor, opacity: bodyOpacity, lineHeight: 1.7 }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="profile-block pt-2">
            <div
              className="w-16 h-px mb-5"
              style={{ backgroundColor: isDark ? 'var(--gold-a30)' : 'var(--gold-500)' }}
            />
            <p
              className="italic text-fluid-lg"
              style={{ fontFamily: 'var(--font-alegreya)', color: accentColor, lineHeight: 1.5 }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
