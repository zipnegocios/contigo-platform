'use client'

import { useCallback } from 'react'
import { Navigation } from '@/presentation/components/Navigation'
import { useVoiceSearch } from '@/presentation/hooks/useVoiceSearch'

export function VoiceSearchNav() {
  const handleTranscript = useCallback((transcript: string) => {
    if (transcript.includes('service') || transcript.includes('build')) {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('project') || transcript.includes('work')) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('contact') || transcript.includes('quote')) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else if (transcript.includes('about') || transcript.includes('heritage')) {
      document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const { isListening, startListening } = useVoiceSearch(handleTranscript)

  return <Navigation onVoiceSearch={startListening} isListening={isListening} />
}
