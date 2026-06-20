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

interface ContactPickerOrCreateProps {
  leadId: string
  contacts: LeadContactDTO[]
  onContactsChange: Dispatch<SetStateAction<LeadContactDTO[]>>
  value: string | null
  onChange: (contactId: string | null) => void
}

const NEW_CONTACT_VALUE = '__new__'

export function ContactPickerOrCreate({ leadId, contacts, onContactsChange, value, onChange }: ContactPickerOrCreateProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<LeadContactRole | ''>('')
  const [saving, setSaving] = useState(false)

  const visibleContacts = contacts.filter((c) => c.archivedAt === null)

  const handleSelectChange = (selected: string) => {
    if (selected === NEW_CONTACT_VALUE) {
      setCreating(true)
      return
    }
    onChange(selected)
  }

  const createContact = async () => {
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
      if (!res.ok) throw new Error('Failed to create contact')
      const { contact } = await res.json()
      const parsed: LeadContactDTO = {
        ...contact,
        createdAt: new Date(contact.createdAt),
        updatedAt: new Date(contact.updatedAt),
        archivedAt: contact.archivedAt ? new Date(contact.archivedAt) : null,
      }
      onContactsChange((prev) => [...prev, parsed])
      onChange(parsed.id)
      setName(''); setPhone(''); setEmail(''); setRole(''); setCreating(false)
      toast.success('Contact added')
    } catch {
      toast.error('Could not add contact')
    } finally {
      setSaving(false)
    }
  }

  if (creating) {
    return (
      <div className="space-y-2 rounded-lg p-3" style={{ border: '1px solid #E5DDD0' }}>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select value={role} onValueChange={(v) => setRole(v as LeadContactRole)}>
          <SelectTrigger><SelectValue placeholder="Role (optional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="site_manager">Site Manager</SelectItem>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={createContact} disabled={saving}>Save contact</Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <Select value={value ?? undefined} onValueChange={handleSelectChange}>
      <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
      <SelectContent>
        {visibleContacts.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}{c.isPrimary ? ' (Primary)' : ''}</SelectItem>
        ))}
        <SelectItem value={NEW_CONTACT_VALUE}>+ New contact</SelectItem>
      </SelectContent>
    </Select>
  )
}
