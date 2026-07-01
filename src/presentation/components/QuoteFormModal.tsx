'use client'

import { X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/presentation/components/ui/dialog'
import { QuoteForm } from './QuoteForm'

interface QuoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteFormModal({ open, onOpenChange }: QuoteFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-transparent"
        className="sm:max-w-lg border-0 bg-transparent p-0 shadow-none overflow-visible"
      >
        <DialogTitle className="sr-only">Request a Quote</DialogTitle>

        <div className="relative">
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--gold-400)',
                color: '#1E1A16',
                boxShadow: '0 6px 18px -4px rgba(0,0,0,0.35)',
              }}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </DialogClose>

          <div
            className="modal-scroll-panel max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--contigo-background)',
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{ height: 3, background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))' }}
            />
            <QuoteForm layout="modal" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
