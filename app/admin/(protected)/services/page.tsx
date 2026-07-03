import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ServiceGroupedView } from '@/presentation/components/admin/ServiceGroupedView'
import type { ServiceGroup } from '@/presentation/components/admin/ServiceGroupedView'

export default async function ServicesPage() {
  const serviceRepo = new DrizzleServiceRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [categories, services] = await Promise.all([
    categoryRepo.findAll('shared', true),
    serviceRepo.findAll(200),
  ])

  const groups: ServiceGroup[] = categories
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      services: services
        .filter((s) => s.categoryId === cat.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          status: s.status,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
        })),
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-fluid-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Services
        </h1>
        <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
          Manage services grouped by category · drag rows to reorder
        </p>
      </div>

      <ServiceGroupedView groups={groups} />
    </div>
  )
}
