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
  Tag,
  Images,
} from 'lucide-react'
import { Button } from '@/presentation/design-system/components/atoms'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Inbox', href: '/admin/inbox', icon: Inbox },
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Media Library', href: '/admin/media', icon: Images },
  { label: 'Leads', href: '/admin/leads', icon: Trello },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname() || ''

  return (
    <aside className="w-64 flex flex-col h-screen" style={{ backgroundColor: 'var(--petrol-800)' }}>
      {/* Header / Logo */}
      <div
        className="p-6 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--gold-a12)' }}
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
              fontFamily: 'var(--contigo-font-display)',
              color: 'var(--neutral-50)',
              letterSpacing: '0.04em',
            }}
          >
            Contigo
          </span>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--neutral-600)' }}>
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
                      backgroundColor: 'var(--gold-a15)',
                      color: 'var(--gold-400)',
                      borderLeft: '2px solid var(--gold-400)',
                    }
                  : {
                      color: 'var(--neutral-50)',
                      borderLeft: '2px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--gold-a12)'
                  e.currentTarget.style.color = 'var(--gold-400)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--neutral-50)'
                }
              }}
            >
              <Icon
                size={18}
                style={{ color: isActive ? 'var(--gold-400)' : 'currentColor', flexShrink: 0 }}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4" style={{ borderTop: '1px solid var(--gold-a12)' }}>
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-2.5 text-sm h-auto"
          style={{ color: 'var(--neutral-600)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gold-400)'
            e.currentTarget.style.backgroundColor = 'var(--gold-a12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--neutral-600)'
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
