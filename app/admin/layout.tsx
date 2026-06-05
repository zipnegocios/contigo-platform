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

  return <div className="flex min-h-screen">{children}</div>
}
