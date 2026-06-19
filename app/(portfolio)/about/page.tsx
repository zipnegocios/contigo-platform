import { Metadata } from 'next'
import HeritageSection from '@/presentation/sections/HeritageSection'

export const metadata: Metadata = {
  title: 'About | Contigo Constructions',
  description: 'Learn about Contigo Constructions — Adelaide builders honoring heritage craftsmanship with modern precision.',
  openGraph: {
    title: 'About Contigo Constructions',
    description: 'Learn about Contigo Constructions — Adelaide builders honoring heritage craftsmanship with modern precision.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="relative py-24 px-6 md:px-16"
        style={{
          backgroundColor: '#1E1A16',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <span
          className="block text-fluid-xs uppercase tracking-widest mb-4"
          style={{ color: '#E2C063' }}
        >
          Our Story
        </span>
        <h1
          className="text-fluid-5xl font-semibold leading-none mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}
        >
          About Contigo
        </h1>
        <p className="text-fluid-base max-w-xl" style={{ color: 'rgba(250,246,240,0.6)' }}>
          Heritage craftsmanship, modern precision — the values that shape every project we build.
        </p>
      </div>

      <HeritageSection />
    </div>
  )
}
