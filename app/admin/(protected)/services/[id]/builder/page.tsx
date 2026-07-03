import { notFound, redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ServicePageBuilder } from '@/presentation/components/admin/page-builder/ServicePageBuilder'

interface BuilderPageProps {
  params: Promise<{ id: string }>
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  const { id } = await params
  const serviceRepo = new DrizzleServiceRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [service, categories] = await Promise.all([
    serviceRepo.findById(id),
    categoryRepo.findAll('shared', true),
  ])

  if (!service) notFound()

  return (
    <ServicePageBuilder
      service={{
        id: service.id,
        name: service.name,
        shortDescription: service.shortDescription,
        imageUrl: service.imageUrl,
        status: service.status,
        pageBlocks: service.pageBlocks,
        categoryId: service.categoryId,
        slug: service.slug,
      }}
      categorySlug={
        service.categoryId
          ? (categories.find((c) => c.id === service.categoryId)?.slug ?? 'services')
          : 'services'
      }
    />
  )
}
