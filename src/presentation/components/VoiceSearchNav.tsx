'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/presentation/components/Navigation'
import { useVoiceSearch } from '@/presentation/hooks/useVoiceSearch'

export function VoiceSearchNav() {
  const router = useRouter()

  const handleTranscript = useCallback((transcript: string) => {
    if (transcript.includes('service') || transcript.includes('build')) {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('project') || transcript.includes('work')) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('contact') || transcript.includes('quote')) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('about') || transcript.includes('heritage')) {
      router.push('/about')
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [router])

  const { isListening, startListening } = useVoiceSearch(handleTranscript)

  return <Navigation onVoiceSearch={startListening} isListening={isListening} />
}
