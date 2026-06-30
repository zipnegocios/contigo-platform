import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'

export async function generateStaticParams() {
  return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
}

export default function ServiceCategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
