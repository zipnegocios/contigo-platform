'use client'

import { Dialog, DialogContent, DialogTitle } from '@/presentation/components/ui/dialog'
import { QuoteForm } from './QuoteForm'

interface QuoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteFormModal({ open, onOpenChange }: QuoteFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[88vh] overflow-y-auto border-0 p-0"
        style={{ backgroundColor: 'var(--contigo-background)' }}
      >
        <DialogTitle className="sr-only">Request a Quote</DialogTitle>
        <div
          style={{ height: 3, background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))' }}
        />
        <QuoteForm layout="modal" />
      </DialogContent>
    </Dialog>
  )
}
