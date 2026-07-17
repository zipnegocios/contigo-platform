import { SidebarProvider } from '@/presentation/components/ui/sidebar'
import AdminSidebar from '@/presentation/components/admin/AdminSidebar'
import { auth } from '@/infrastructure/auth/auth.config'
import { hasPermission } from '@/infrastructure/auth/hasPermission'
import { redirect } from 'next/navigation'
import { Toaster } from '@/presentation/components/ui/sonner'
import { AdminRealtimeProvider } from '@/presentation/providers/AdminRealtimeProvider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Checks `.user`, not just session truthiness — an invalidated session
  // (password reset, deactivation) still resolves to a session object but
  // with `user` cleared, see auth.config.ts's `session` callback.
  if (!session?.user) {
    redirect('/admin/login')
  }

  const userId = (session.user as { id?: string })?.id
  const canViewSecurity = !!userId && (await hasPermission(userId, 'settings.manage'))

  return (
    <AdminRealtimeProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AdminSidebar canViewSecurity={canViewSecurity} />
          <main className="flex-1 overflow-auto min-h-screen" style={{ backgroundColor: '#FAF6F0' }}>
            <div className="p-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </SidebarProvider>
    </AdminRealtimeProvider>
  )
}
