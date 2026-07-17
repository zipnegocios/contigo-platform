import Link from 'next/link'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { resolveServicePreviewPath } from '@/infrastructure/services/resolveServiceRootSlug'
import { ServiceGroupedView } from '@/presentation/components/admin/ServiceGroupedView'
import type { ServiceGroup } from '@/presentation/components/admin/ServiceGroupedView'
import { ServicesTrashView } from '@/presentation/components/admin/ServicesTrashView'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const serviceRepo = new DrizzleServiceRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [categories, services] = await Promise.all([
    categoryRepo.findAll('shared', true),
    isTrash ? serviceRepo.findTrashed() : serviceRepo.findAll(200),
  ])

  if (isTrash) {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Services Trash
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Trashed services — restore them to bring them back.{' '}
            <Link href="/admin/services" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Back to list
            </Link>
          </p>
        </div>
        <ServicesTrashView
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            imageUrl: s.imageUrl,
            category: s.categoryId ? (catMap.get(s.categoryId) ?? '—') : '—',
          }))}
        />
      </div>
    )
  }

  const catById = new Map(categories.map((c) => [c.id, c]))

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
          metaTitle: s.metaTitle,
          noIndex: s.noIndex,
          previewPath: resolveServicePreviewPath(s, catById),
        })),
    }))

  const uncategorized = services.filter((s) => s.categoryId === null)
  if (uncategorized.length > 0) {
    groups.push({
      categoryId: null,
      categoryName: 'Uncategorized',
      categorySlug: 'uncategorized',
      services: uncategorized
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s) => ({
          id: s.id,
          name: s.name,
          shortDescription: s.shortDescription,
          orderIndex: s.orderIndex,
          status: s.status,
          imageUrl: s.imageUrl,
          categoryId: s.categoryId,
          metaTitle: s.metaTitle,
          noIndex: s.noIndex,
          previewPath: null,
        })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Link href="/admin/services?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
          View Trash
        </Link>
      </div>

      <ServiceGroupedView groups={groups} />
    </div>
  )
}
