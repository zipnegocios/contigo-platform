import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryManagerClient } from '@/presentation/components/admin/CategoryManagerClient'

export default async function CategoriesPage() {
  const repo = new DrizzleCategoryRepository()
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

      <CategoryManagerClient categories={flat} />
    </div>
  )
}
