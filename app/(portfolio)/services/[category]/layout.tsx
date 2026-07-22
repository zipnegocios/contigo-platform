import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'
import { getPublicServiceCategories } from '@/infrastructure/services/getPublicServiceCategories'

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
    const visible = await getPublicServiceCategories()
    return visible.map((cat) => ({ category: cat.slug }))
  } catch {
    return []
  }
}

export default function ServiceCategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div style={{ backgroundColor: 'var(--petrol-800, #0D3C4C)' }}>{children}</div>
}
