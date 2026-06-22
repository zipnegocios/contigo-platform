'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { Switch } from '@/presentation/components/ui/switch'
import { Badge } from '@/presentation/components/ui/badge'
import { PERMISSION_OPTIONS } from '@/presentation/constants/staffPermissions'

export interface StaffRow {
  id: string
  email: string
  name: string
  role: 'owner' | 'staff'
  title: string | null
  phone: string | null
  isActive: boolean
  permissionKeys: string[]
}

export function StaffTable({ staff }: { staff: StaffRow[] }) {
  const router = useRouter()
  const [pendingPermission, setPendingPermission] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  async function togglePermission(row: StaffRow, key: string, checked: boolean) {
    const nextKeys = checked
      ? [...row.permissionKeys, key]
      : row.permissionKeys.filter((k) => k !== key)

    setPendingPermission(`${row.id}:${key}`)
    try {
      const res = await fetch(`/api/admin/staff/${row.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionKeys: nextKeys }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update permissions')
        return
      }
      router.refresh()
    } finally {
      setPendingPermission(null)
    }
  }

  async function toggleActive(row: StaffRow) {
    setPendingStatus(row.id)
    try {
      const res = await fetch(`/api/admin/staff/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update status')
        return
      }
      router.refresh()
    } finally {
      setPendingStatus(null)
    }
  }

  return (
    <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(226, 192, 99, 0.15)' }}>
      <table className="w-full text-fluid-sm">
        <thead>
          <tr style={{ backgroundColor: 'rgba(226, 192, 99, 0.06)', borderBottom: '1px solid rgba(226, 192, 99, 0.12)' }}>
            <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Name</th>
            <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Email</th>
            <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Title</th>
            <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Role</th>
            <th className="text-left px-5 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>Status</th>
            {PERMISSION_OPTIONS.map((perm) => (
              <th
                key={perm.key}
                className="text-center px-3 py-3 font-semibold whitespace-nowrap"
                style={{ color: 'var(--neutral-600)' }}
                title={perm.label}
              >
                {perm.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((row, i) => {
            const isOwner = row.role === 'owner'
            return (
              <tr
                key={row.id}
                style={{
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  borderBottom: '1px solid rgba(226, 192, 99, 0.08)',
                }}
              >
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
                  {row.name}
                </td>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                  {row.email}
                </td>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--neutral-600)' }}>
                  {row.title ?? '—'}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <Badge variant={isOwner ? 'default' : 'secondary'} className="capitalize">
                    {row.role}
                  </Badge>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.isActive}
                      disabled={pendingStatus === row.id}
                      onCheckedChange={() => toggleActive(row)}
                    />
                    <Badge variant={row.isActive ? 'default' : 'destructive'}>
                      {row.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </td>
                {PERMISSION_OPTIONS.map((perm) => (
                  <td key={perm.key} className="px-3 py-3 text-center">
                    <Checkbox
                      checked={row.permissionKeys.includes(perm.key)}
                      disabled={isOwner || pendingPermission === `${row.id}:${perm.key}`}
                      onCheckedChange={(checked) => togglePermission(row, perm.key, checked === true)}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
          {staff.length === 0 && (
            <tr>
              <td colSpan={5 + PERMISSION_OPTIONS.length} className="px-5 py-8 text-center text-fluid-sm" style={{ color: 'var(--neutral-600)' }}>
                No staff users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
