import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryTable } from '@/presentation/components/admin/CategoryTable'
import { NewCategoryForm } from '@/presentation/components/admin/NewCategoryForm'

export default async function CategoriesPage() {
  const repo = new DrizzleCategoryRepository()
  const categories = await repo.findAll()

  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isSystem: c.isSystem,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-4xl font-semibold"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
          >
            Categories
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
            Manage project categories
          </p>
        </div>
        <NewCategoryForm />
      </div>

      <CategoryTable categories={rows} />
    </div>
  )
}
