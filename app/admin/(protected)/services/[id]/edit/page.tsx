import { notFound } from 'next/navigation'
import { ServiceForm } from '@/presentation/components/admin/ServiceForm'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params
  const serviceRepo = new DrizzleServiceRepository()
  const service = await serviceRepo.findById(id)

  if (!service) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
        >
          Edit Service
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
          {service.name}
        </p>
      </div>

      <ServiceForm
        service={{
          id: service.id,
          name: service.name,
          slug: service.slug,
          shortDescription: service.shortDescription,
          fullDescription: service.fullDescription,
          imageUrl: service.imageUrl,
          published: service.published,
        }}
      />
    </div>
  )
}
