'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QuoteFormModal } from '@/presentation/components/QuoteFormModal'

interface ServiceCtaSidebarProps {
  serviceName: string
}

export function ServiceCtaSidebar({ serviceName }: ServiceCtaSidebarProps) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)

  return (
    <>
      <aside className="lg:w-72 xl:w-80 flex-shrink-0">
        <div
          className="rounded-2xl p-8 sticky top-8"
          style={{
            backgroundColor: '#1E1A16',
            border: '1px solid rgba(226,192,99,0.18)',
          }}
        >
          <h3
            className="text-fluid-xs uppercase tracking-widest mb-4"
            style={{ color: '#E2C063' }}
          >
            Interested?
          </h3>
          <p className="text-fluid-sm mb-6" style={{ color: '#A89E8C', lineHeight: 1.6 }}>
            Our team specialises in {serviceName.toLowerCase()}. Tell us about your project and we&apos;ll be in touch.
          </p>

          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-fluid-sm font-semibold transition-all duration-200 mb-3"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            Request a Quote
          </button>

          <Link
            href="/projects"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-fluid-sm font-medium transition-all duration-200"
            style={{ border: '1px solid rgba(226,192,99,0.3)', color: '#E2C063' }}
          >
            View Our Projects
          </Link>
        </div>
      </aside>

      <QuoteFormModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </>
  )
}
