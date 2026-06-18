'use client'

import { ReactNode } from 'react'
import { LogoMorphProvider } from '@/presentation/providers/LogoMorphProvider'
import { MorphingLogo } from '@/presentation/components/MorphingLogo'

export function MarketingPageClient({ children }: { children: ReactNode }) {
  return (
    <LogoMorphProvider>
      <MorphingLogo />
      {children}
    </LogoMorphProvider>
  )
}
