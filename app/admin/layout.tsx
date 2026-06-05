import { auth } from '@/infrastructure/auth/auth.config'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/presentation/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin Portal | Contigo',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
