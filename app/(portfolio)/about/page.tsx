import { Metadata } from 'next'
import AboutHero from '@/presentation/sections/AboutHero'
import MissionVisionSection from '@/presentation/sections/MissionVisionSection'
import ValuePropositionBand from '@/presentation/sections/ValuePropositionBand'
import CoreValuesSection from '@/presentation/sections/CoreValuesSection'
import BrandPromiseSection from '@/presentation/sections/BrandPromiseSection'
import MasterBuildersSection from '@/presentation/sections/MasterBuildersSection'
import AboutClosingCTA from '@/presentation/sections/AboutClosingCTA'

export const metadata: Metadata = {
  title: 'About Contigo Constructions | Licensed Carpentry & Joinery Adelaide',
  description:
    'Learn more about Contigo Constructions, a licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, framing, pergolas, decking and cladding.',
  keywords: [
    'Carpentry & Joinery Adelaide',
    'Licensed Carpentry Contractor Adelaide',
    'Home Renovations Adelaide',
    'Master Builders South Australia',
  ],
  alternates: {
    canonical: 'https://contigoconstructions.com.au/about',
  },
  openGraph: {
    title: 'About Contigo Constructions | Licensed Carpentry & Joinery Adelaide',
    description:
      'Learn more about Contigo Constructions, a licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, framing, pergolas, decking and cladding.',
    url: 'https://contigoconstructions.com.au/about',
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
      <MasterBuildersSection />
      <AboutClosingCTA />
    </div>
  )
}
