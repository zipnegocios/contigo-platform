'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { QuoteForm } from './QuoteForm'

interface QuoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteFormModal({ open, onOpenChange }: QuoteFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--contigo-background)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-fluid-2xl font-cormorant font-bold"
            style={{ color: 'var(--contigo-foreground)' }}
          >
            Request a Quote
          </DialogTitle>
        </DialogHeader>
        <QuoteForm />
      </DialogContent>
    </Dialog>
  )
}
