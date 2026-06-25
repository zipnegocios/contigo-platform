import { Metadata } from 'next'
import AboutHero from '@/presentation/sections/AboutHero'
import MissionVisionSection from '@/presentation/sections/MissionVisionSection'
import ValuePropositionBand from '@/presentation/sections/ValuePropositionBand'
import CoreValuesSection from '@/presentation/sections/CoreValuesSection'
import BrandPromiseSection from '@/presentation/sections/BrandPromiseSection'
import AboutClosingCTA from '@/presentation/sections/AboutClosingCTA'

export const metadata: Metadata = {
  title: 'About | Contigo Constructions',
  description: 'Contigo Constructions Pty Ltd — mission, vision, and the values that shape every project we build with our clients across Adelaide.',
  openGraph: {
    title: 'About Contigo Constructions',
    description: 'Contigo Constructions Pty Ltd — mission, vision, and the values that shape every project we build with our clients across Adelaide.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'var(--neutral-50)', minHeight: '100vh' }}>
      <AboutHero />
      <MissionVisionSection />
      <ValuePropositionBand />
      <CoreValuesSection />
      <BrandPromiseSection />
      <AboutClosingCTA />
    </div>
  )
}
