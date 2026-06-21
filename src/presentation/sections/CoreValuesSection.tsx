'use client'

import { HeartHandshake, Gem, ShieldCheck, Target, Users } from 'lucide-react'
import { Icon } from '@/presentation/design-system/components/atoms'
import { useScrollReveal } from '@/presentation/hooks/useScrollReveal'

const VALUES = [
  {
    icon: HeartHandshake,
    name: 'Commitment',
    keyword: 'Accountability',
    description: 'We honour our agreements and deliver with accountability and professionalism.',
  },
  {
    icon: Gem,
    name: 'Quality',
    keyword: 'Excellence',
    description: 'We apply high technical and execution standards in every detail.',
  },
  {
    icon: ShieldCheck,
    name: 'Trust',
    keyword: 'Transparency',
    description: 'We build transparent and long-lasting relationships with clients, suppliers, and our team.',
  },
  {
    icon: Target,
    name: 'Responsibility',
    keyword: 'Reliability',
    description: 'We manage each project with a professional approach, meeting scope, timelines, and budgets.',
  },
  {
    icon: Users,
    name: 'Teamwork',
    keyword: 'Collaboration',
    description: 'We foster collaboration as the foundation for strong and sustainable results.',
  },
]

export default function CoreValuesSection() {
  const listRef = useScrollReveal<HTMLDivElement>({
    y: 24,
    duration: 0.7,
    stagger: 0.12,
    start: 'top 80%',
    childSelector: '.value-row',
  })

  return (
    <section
      className="section-gap page-padding"
      style={{ backgroundColor: 'var(--neutral-50)', fontFamily: 'var(--font-alegreya-sans)' }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="mb-16 text-center"
          style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--contigo-foreground)' }}
        >
          Our Values
        </h2>

        <div ref={listRef}>
          {VALUES.map((value) => (
            <div
              key={value.name}
              className="value-row flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 py-8"
              style={{ borderTop: '1px solid var(--gold-a15)' }}
            >
              <Icon
                icon={value.icon}
                size="xl"
                style={{ color: 'var(--gold-400)' }}
                className="flex-shrink-0"
              />

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 flex-1">
                <h3
                  className="sm:whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-alegreya)',
                    fontWeight: 500,
                    fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)',
                    color: 'var(--contigo-foreground)',
                    minWidth: 'clamp(10rem, 14vw, 13rem)',
                  }}
                >
                  {value.name}
                  <span
                    className="block whitespace-normal text-fluid-xs mt-1"
                    style={{ color: 'var(--petrol-600)', fontFamily: 'var(--font-alegreya-sans)', fontWeight: 400 }}
                  >
                    {value.keyword}
                  </span>
                </h3>
                <p
                  className="text-fluid-base"
                  style={{ color: 'var(--contigo-foreground)', opacity: 0.75, lineHeight: 1.6 }}
                >
                  {value.description}
                </p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--gold-a15)' }} />
        </div>
      </div>
    </section>
  )
}
