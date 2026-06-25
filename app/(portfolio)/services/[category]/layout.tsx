import { ServiceCategoryTabs } from '@/presentation/components/ServiceCategoryTabs'
import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'

export async function generateStaticParams() {
  return SERVICE_ROOT_SLUGS.map((category) => ({ category }))
}

export default function ServiceCategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      <div
        className="px-6 pt-32 pb-6 md:px-16 md:pt-40"
        style={{
          backgroundColor: 'var(--petrol-800)',
          borderBottom: '1px solid rgba(226,192,99,0.15)',
        }}
      >
        <ServiceCategoryTabs />
      </div>
      {children}
    </div>
  )
}
