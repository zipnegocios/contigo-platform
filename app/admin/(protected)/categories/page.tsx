import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryManagerClient } from '@/presentation/components/admin/CategoryManagerClient'

export default async function CategoriesPage() {
  const repo = new DrizzleCategoryRepository()
  const [serviceFlat, projectFlat] = await Promise.all([
    repo.findFlat('service'),
    repo.findFlat('project'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-4xl font-semibold"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924', lineHeight: 1.2 }}
        >
          Categories
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
          Manage hierarchical categories for services and projects
        </p>
      </div>

      <CategoryManagerClient serviceFlat={serviceFlat} projectFlat={projectFlat} />
    </div>
  )
}
