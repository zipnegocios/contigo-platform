'use client'

import { useState } from 'react'
import { Lightbox } from '@/presentation/components/Lightbox'

interface ServiceHeroPhotoButtonProps {
  imageUrl: string
  title: string
}

export function ServiceHeroPhotoButton({ imageUrl, title }: ServiceHeroPhotoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View full photo"
        className="absolute bottom-12 right-8 md:bottom-16 md:right-16 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#FAF6F0' }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
          <circle cx="12" cy="12" r="3.75" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <Lightbox
          items={[{ url: imageUrl, title, order: 0 }]}
          startIndex={0}
          onClose={() => setOpen(false)}
          variant="clean"
        />
      )}
    </>
  )
}
