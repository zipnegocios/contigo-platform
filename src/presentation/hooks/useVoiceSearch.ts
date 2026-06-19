'use client'

import { useCallback, useState } from 'react'

export function useVoiceSearch(onTranscript: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser. Please use the contact form.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-AU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      setIsListening(false)
      onTranscript(transcript)
    }

    recognition.start()
  }, [isListening, onTranscript])

  return { isListening, startListening }
}
