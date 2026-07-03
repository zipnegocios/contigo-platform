import Link from 'next/link'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryManagerClient } from '@/presentation/components/admin/CategoryManagerClient'
import { CategoriesTrashView } from '@/presentation/components/admin/CategoriesTrashView'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>
}) {
  const { trash } = await searchParams
  const isTrash = trash === '1'

  const repo = new DrizzleCategoryRepository()

  if (isTrash) {
    const trashed = await repo.findTrashed('shared')
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Categories Trash
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Trashed categories — restore them to bring them back.{' '}
            <Link href="/admin/categories" className="underline" style={{ color: 'var(--contigo-primary)' }}>
              Back to list
            </Link>
          </p>
        </div>
        <CategoriesTrashView
          categories={trashed.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        />
      </div>
    )
  }

  const categories = await repo.findAll('shared', false)

  const flat = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    type: c.type,
    description: c.description,
    icon: c.icon,
    orderIndex: c.orderIndex,
    status: c.status,
    isSystem: c.isSystem,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-fluid-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Categories
          </h1>
          <p className="text-fluid-sm mt-1" style={{ color: '#6B6560' }}>
            Main categories shared across services and projects
          </p>
        </div>
        <Link href="/admin/categories?trash=1" className="text-fluid-sm underline" style={{ color: '#6B6560' }}>
          View Trash
        </Link>
      </div>

      <CategoryManagerClient categories={flat} />
    </div>
  )
}
