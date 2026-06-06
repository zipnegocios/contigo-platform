import { SidebarProvider } from '@/presentation/components/ui/sidebar'
import AdminSidebar from '@/presentation/components/admin/AdminSidebar'
import { auth } from '@/infrastructure/auth/auth.config'
import { redirect } from 'next/navigation'

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
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
