'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/presentation/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/presentation/components/ui/popover'
import { cn } from '@/lib/utils'

export interface LeadContactRoleOption {
  id: string
  key: string
  label: string
  isDefault: boolean
}

interface LeadContactRoleComboboxProps {
  value: string | null
  onChange: (roleId: string | null) => void
  roles: LeadContactRoleOption[]
  onRolesChange: (roles: LeadContactRoleOption[]) => void
  placeholder?: string
}

export function LeadContactRoleCombobox({
  value,
  onChange,
  roles,
  onRolesChange,
  placeholder = 'Role (optional)',
}: LeadContactRoleComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [loaded, setLoaded] = useState(roles.length > 0)

  useEffect(() => {
    if (loaded) return
    let cancelled = false
    fetch('/api/admin/lead-contact-roles')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load roles'))))
      .then((data) => {
        if (!cancelled) {
          onRolesChange(data.roles ?? [])
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load roles')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const selectedRole = roles.find((r) => r.id === value) ?? null
  const trimmedSearch = search.trim()
  const exactMatch = roles.some((r) => r.label.toLowerCase() === trimmedSearch.toLowerCase())

  const handleSelect = (roleId: string) => {
    onChange(roleId === value ? null : roleId)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = async () => {
    if (!trimmedSearch) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/lead-contact-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmedSearch }),
      })
      if (!res.ok) throw new Error('Failed to create role')
      const { role } = await res.json()
      const exists = roles.some((r) => r.id === role.id)
      onRolesChange(exists ? roles : [...roles, role])
      onChange(role.id)
      setOpen(false)
      setSearch('')
      toast.success('Role added')
    } catch {
      toast.error('Could not create role')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedRole ? selectedRole.label : placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create role..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2">
              {trimmedSearch ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                >
                  <Plus className="size-4" />
                  Create &quot;{trimmedSearch}&quot;
                </button>
              ) : (
                <span className="px-2 text-sm text-muted-foreground">No roles found</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {roles
                .filter((r) => r.label.toLowerCase().includes(trimmedSearch.toLowerCase()))
                .map((r) => (
                  <CommandItem key={r.id} value={r.label} onSelect={() => handleSelect(r.id)}>
                    <Check
                      className={cn('mr-2 size-4', value === r.id ? 'opacity-100' : 'opacity-0')}
                    />
                    {r.label}
                  </CommandItem>
                ))}
              {trimmedSearch && !exactMatch && (
                <CommandItem value={`__create__${trimmedSearch}`} onSelect={handleCreate} disabled={creating}>
                  <Plus className="mr-2 size-4" />
                  Create &quot;{trimmedSearch}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
