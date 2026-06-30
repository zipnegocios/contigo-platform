import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { CategoryManagerClient } from '@/presentation/components/admin/CategoryManagerClient'

export default async function CategoriesPage() {
  const repo = new DrizzleCategoryRepository()
  // Admin Category Manager must keep showing inactive categories so they
  // can be reviewed/reactivated, not just the default active-only set.
  const [serviceFlat, projectFlat, sharedFlatMapped] = await Promise.all([
    repo.findFlat('service', false),
    repo.findFlat('project', false),
    repo.findFlat('shared', false),
  ])

  // Remove shared categories from the service/project flat lists so they
  // don't appear twice (findFlat now includes shared in both queries).
  const sharedIds = new Set(sharedFlatMapped.map((c) => c.id))
  const serviceOnly = serviceFlat.filter((c) => !sharedIds.has(c.id))
  const projectOnly = projectFlat.filter((c) => !sharedIds.has(c.id))

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
          Manage hierarchical categories for services and projects
        </p>
      </div>

      <CategoryManagerClient
        sharedFlat={sharedFlatMapped}
        serviceFlat={serviceOnly}
        projectFlat={projectOnly}
      />
    </div>
  )
}
