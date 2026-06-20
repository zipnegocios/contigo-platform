'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import type { LeadContactDTO } from '@/presentation/types/LeadContactDTO'
import type { LeadContactRole } from '@/core/entities/LeadContact'

interface LeadContactsPanelProps {
  leadId: string
  contacts: LeadContactDTO[]
  onContactsChange: Dispatch<SetStateAction<LeadContactDTO[]>>
}

const ROLE_LABELS: Record<LeadContactRole, string> = {
  owner: 'Owner',
  site_manager: 'Site Manager',
  spouse: 'Spouse',
  other: 'Other',
}

export function LeadContactsPanel({ leadId, contacts, onContactsChange }: LeadContactsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<LeadContactRole | ''>('')
  const [saving, setSaving] = useState(false)

  const visibleContacts = contacts.filter((c) => c.archivedAt === null)

  const addContact = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, role: role || undefined }),
      })
      if (!res.ok) throw new Error('Failed to add contact')
      const { contact } = await res.json()
      const parsed: LeadContactDTO = {
        ...contact,
        createdAt: new Date(contact.createdAt),
        updatedAt: new Date(contact.updatedAt),
        archivedAt: contact.archivedAt ? new Date(contact.archivedAt) : null,
      }
      onContactsChange((prev) => [...prev, parsed])
      setName('')
      setPhone('')
      setEmail('')
      setRole('')
      setShowForm(false)
      toast.success('Contact added')
    } catch {
      toast.error('Could not add contact')
    } finally {
      setSaving(false)
    }
  }

  const archiveContact = async (contactId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/contacts/${contactId}/archive`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to remove contact')
      onContactsChange((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, archivedAt: new Date() } : c)),
      )
      toast.success('Contact removed')
    } catch {
      toast.error('Could not remove contact')
    }
  }

  return (
    <div className="space-y-3">
      {visibleContacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-start justify-between gap-3 rounded-lg p-3"
          style={{ border: '1px solid #E5DDD0' }}
        >
          <div>
            <p className="text-fluid-sm font-medium" style={{ color: 'var(--neutral-800)' }}>
              {contact.name}
              {contact.isPrimary && (
                <span
                  className="ml-2 text-fluid-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A08040' }}
                >
                  Primary
                </span>
              )}
              {contact.role && (
                <span
                  className="ml-2 text-fluid-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-600)' }}
                >
                  {ROLE_LABELS[contact.role]}
                </span>
              )}
            </p>
            <p className="text-fluid-xs" style={{ color: 'var(--neutral-600)' }}>
              {contact.phone}
              {contact.email ? ` · ${contact.email}` : ''}
            </p>
          </div>
          {!contact.isPrimary && (
            <Button size="sm" variant="ghost" onClick={() => archiveContact(contact.id)}>
              Remove
            </Button>
          )}
        </div>
      ))}

      {showForm ? (
        <div className="space-y-2 rounded-lg p-3" style={{ border: '1px solid #E5DDD0' }}>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select value={role} onValueChange={(v) => setRole(v as LeadContactRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Role (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="site_manager">Site Manager</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={addContact} disabled={saving}>
              Save contact
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          + Add contact
        </Button>
      )}
    </div>
  )
}
