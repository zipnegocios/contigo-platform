'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { ContactDetails } from './ContactDetails'

interface ContactInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactInfoModal({ open, onOpenChange }: ContactInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{ backgroundColor: 'var(--contigo-background)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-fluid-2xl font-cormorant font-bold"
            style={{ color: 'var(--contigo-foreground)' }}
          >
            Get in Touch
          </DialogTitle>
        </DialogHeader>
        <ContactDetails />
      </DialogContent>
    </Dialog>
  )
}
