'use client'

import Image from 'next/image'
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
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Inbox', href: '/admin/inbox', icon: Inbox },
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'Leads', href: '/admin/leads', icon: Trello },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname() || ''

  return (
    <aside className="w-64 flex flex-col h-screen" style={{ backgroundColor: '#1E1A16' }}>
      {/* Header / Logo */}
      <div
        className="p-6 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}
      >
        <Image
          src="/assets/isotipo.png"
          alt="Contigo"
          width={32}
          height={32}
          className="object-contain"
        />
        <div>
          <span
            className="text-xl font-semibold tracking-wide"
            style={{
              fontFamily: 'var(--font-cormorant)',
              color: '#E8DCC4',
              letterSpacing: '0.04em',
            }}
          >
            Contigo
          </span>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#A89E8C' }}>
            Admin Portal
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group"
              style={
                isActive
                  ? {
                      backgroundColor: 'rgba(226, 192, 99, 0.15)',
                      color: '#E2C063',
                      borderLeft: '2px solid #E2C063',
                    }
                  : {
                      color: '#E8DCC4',
                      borderLeft: '2px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#E2C063'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#E8DCC4'
                }
              }}
            >
              <Icon
                size={18}
                style={{ color: isActive ? '#E2C063' : 'currentColor', flexShrink: 0 }}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(226, 192, 99, 0.12)' }}>
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 text-sm justify-start px-4 py-2.5 rounded-lg transition-all duration-200 h-auto"
          style={{ color: '#A89E8C' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E2C063'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#A89E8C'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
