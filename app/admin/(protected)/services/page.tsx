import Link from 'next/link'
import { ServiceTable } from '@/presentation/components/admin/ServiceTable'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export default async function ServicesPage() {
  const serviceRepo = new DrizzleServiceRepository()
  const services = await serviceRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Services
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
            Manage services and their display order
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 inline-block bg-[#E2C063] hover:bg-[#D4AF37] text-[#1E1A16]"
        >
          + New Service
        </Link>
      </div>

      <ServiceTable services={services.map((s) => ({
        id: s.id,
        name: s.name,
        shortDescription: s.shortDescription,
        orderIndex: s.orderIndex,
        published: s.published,
        imageUrl: s.imageUrl,
      }))} />
    </div>
  )
}
