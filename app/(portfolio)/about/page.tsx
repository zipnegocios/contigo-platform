import { Metadata } from 'next'
import AboutHero from '@/presentation/sections/AboutHero'
import OurStorySection from '@/presentation/sections/OurStorySection'
import TeamMemberProfileSection from '@/presentation/sections/TeamMemberProfileSection'
import TeamSection from '@/presentation/sections/TeamSection'
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
      <OurStorySection />
      <TeamMemberProfileSection
        sectionLabel="Meet Our Director"
        name="Daniel Osorio"
        role="Director | Industrial Engineer | Carpenter"
        photoSrc="https://assets.contigoconstructions.com.au/about/daniel.png"
        photoAlt="Daniel Osorio, Director of Contigo Constructions"
        imageSide="left"
        background="dark"
        paragraphs={[
          'For Daniel Osorio, carpentry has never been just a trade. It’s part of his family’s legacy. Inspired by his grandfather, who was also a carpenter, Daniel inherited not only the craftsmanship but also the values of hard work, integrity, attention to detail, and pride in delivering quality that stands the test of time.',
          'Today, with more than six years of professional carpentry experience and a background as an Industrial Engineer, Daniel leads Contigo Constructions with one clear vision: to create an experience that goes beyond construction. He believes that building is about much more than timber and tools — it’s about listening to people, understanding their goals, and helping them transform one of the most important places in their lives: their home.',
          'Every project represents a responsibility. Because behind every renovation is a family that has placed their trust in us. Behind every deck are future family gatherings. Behind every pergola are long summer afternoons. Behind every extension is a growing family creating new memories. That’s why Daniel approaches every project as if he were building for his own family — with care, precision, open communication, and an unwavering commitment to quality.',
          'For Daniel, success isn’t measured by the number of projects completed. It’s measured by the trust clients place in Contigo Constructions and the pride they feel every time they step into the finished space. His mission is simple: to help people transform houses into homes, creating spaces where life’s best moments will be lived.',
        ]}
        quote="Every project tells a story. Our mission is to help build the next chapter of yours."
      />
      <TeamMemberProfileSection
        sectionLabel="Meet Our Operations & Contract Administrator"
        name="Anamaria Osorio"
        role="Operations & Contract Administrator"
        photoSrc="https://assets.contigoconstructions.com.au/about/anamaria.png"
        photoAlt="Anamaria Osorio, Operations & Contract Administrator at Contigo Constructions"
        imageSide="right"
        background="light"
        paragraphs={[
          'At Contigo Constructions, we believe that an outstanding customer experience begins long before construction starts. With more than 10 years of experience in customer service and over 4 years as a Contract Administrator, Anamaria is dedicated to ensuring every project runs smoothly, efficiently, and with clear communication from the very first enquiry through to project completion.',
          'Her priority is to make every client feel supported throughout the entire journey. From preparing quotations and coordinating suppliers to managing project documentation and keeping clients informed, Anamaria is always available to answer questions, provide guidance, and ensure every detail is handled with care.',
          'She believes that great communication is the foundation of trust — that’s why she is committed to keeping clients informed every step of the way, making the building process as simple, transparent, and stress-free as possible. As Daniel Osorio’s sister, Anamaria also represents the family values at the heart of Contigo Constructions.',
          'To us, our clients are never just another project. They are families placing their trust in us to improve one of the most important places in their lives: their home. Our commitment is to provide a professional, personalised, and transparent experience where every client feels valued, heard, and supported from start to finish.',
        ]}
        quote="Behind every successful project is a relationship built on trust, and trust begins with great communication."
      />
      <TeamSection />
      <MissionVisionSection />
      <ValuePropositionBand />
      <CoreValuesSection />
      <BrandPromiseSection />
      <MasterBuildersSection />
      <AboutClosingCTA />
    </div>
  )
}
