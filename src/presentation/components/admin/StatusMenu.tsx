'use client'

import type { CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_OPTIONS } from '@/types/status'
import type { ContentStatus } from '@/types/status'

const LIGHT_STYLE: Record<ContentStatus, CSSProperties> = {
  active: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d' },
  draft: { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px dashed #E2C063' },
  inactive: { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560' },
}

const DARK_STYLE: Record<ContentStatus, CSSProperties> = {
  active: { backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  draft: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' },
  inactive: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' },
}

interface StatusMenuProps {
  status: ContentStatus
  onChange: (status: ContentStatus) => void
  disabled?: boolean
  theme?: 'light' | 'dark'
}

export function StatusMenu({ status, onChange, disabled, theme = 'light' }: StatusMenuProps) {
  const styleMap = theme === 'dark' ? DARK_STYLE : LIGHT_STYLE

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-fluid-xs font-medium uppercase tracking-wide flex-shrink-0 transition-opacity duration-150 hover:opacity-75 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={styleMap[status]}
        >
          {CONTENT_STATUS_LABEL[status]}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {CONTENT_STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            disabled={option === status}
            onSelect={() => onChange(option)}
          >
            {CONTENT_STATUS_LABEL[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
