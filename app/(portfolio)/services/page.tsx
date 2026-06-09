import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ServicesIndex from '@/presentation/sections/ServicesIndex'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import {
  FALLBACK_SERVICES,
  toServiceView,
  type ServiceView,
} from '@/presentation/data/serviceMeta'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Services | Contigo Constructions',
  description:
    'Ten core construction disciplines, from new home building to Venetian plastering, delivered end to end across Adelaide and South Australia.',
  openGraph: {
    title: 'Our Services | Contigo Constructions',
    description:
      'Ten core construction disciplines, from new home building to Venetian plastering, delivered end to end across Adelaide and South Australia.',
    type: 'website',
  },
}

async function getServices(): Promise<ServiceView[]> {
  // Static fallback keeps the page alive when the DB is empty/unavailable.
  const fallback = () =>
    FALLBACK_SERVICES.map((s, i) => toServiceView(s.slug, s.name, i))

  if (!process.env.DATABASE_URL) return fallback()

  try {
    const repo = new DrizzleCategoryRepository()
    const all = await repo.findAll('service')
    const roots = all
      .filter((c) => c.parentId === null && c.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    if (roots.length === 0) return fallback()

    return roots.map((c, i) => toServiceView(c.slug, c.name, i, c.description))
  } catch (err) {
    console.error('ServicesPage: failed to load service categories', err)
    return fallback()
  }
}

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <main style={{ backgroundColor: 'var(--atelier-ivory)' }}>
      {/* Back-to-home logo (the marketing nav isn't rendered on this route) */}
      <Link
        href="/"
        aria-label="Contigo Constructions — home"
        className="atelier-home-link"
      >
        <Image
          src="/assets/logo-secundario.png"
          alt="Contigo Constructions"
          width={150}
          height={34}
          className="object-contain"
          priority
        />
      </Link>

      <ServicesIndex services={services} />
    </main>
  )
}
