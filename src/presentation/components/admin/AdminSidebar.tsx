'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Inbox,
  FolderOpen,
  Briefcase,
  Trello,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Inbox',
    href: '/admin/inbox',
    icon: Inbox,
  },
  {
    label: 'Projects',
    href: '/admin/projects',
    icon: FolderOpen,
  },
  {
    label: 'Services',
    href: '/admin/services',
    icon: Briefcase,
  },
  {
    label: 'Leads',
    href: '/admin/leads',
    icon: Trello,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">Contigo Admin</h2>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 text-white border-gray-700 hover:bg-gray-800"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
