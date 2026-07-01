import type { WhatsAppCtaBlockData } from '@/types/pageBlocks'
import { MessageCircle } from 'lucide-react'

interface WhatsAppCtaBlockProps { data: WhatsAppCtaBlockData }

export function WhatsAppCtaBlock({ data }: WhatsAppCtaBlockProps) {
  const cleanPhone = data.phoneNumber.replace(/\D/g, '')
  const encodedMsg = encodeURIComponent(data.message)
  const href = `https://wa.me/${cleanPhone}?text=${encodedMsg}`

  if (data.style === 'banner') {
    return (
      <section className="w-full px-6 py-10" style={{ backgroundColor: '#25D366' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-fluid-base font-semibold text-white">{data.label}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-fluid-sm min-h-[44px]"
            style={{ backgroundColor: 'white', color: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            {data.label}
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-8 flex justify-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-7 py-3.5 rounded-full font-semibold text-fluid-sm min-h-[44px] transition-all"
        style={{ backgroundColor: '#25D366', color: 'white' }}
      >
        <MessageCircle className="w-5 h-5" />
        {data.label}
      </a>
    </section>
  )
}
