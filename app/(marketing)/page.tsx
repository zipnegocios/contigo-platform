'use client'

import { useState, useCallback } from 'react'
import { Navigation } from '@/presentation/components/Navigation'
import HeroSection from '@/presentation/sections/HeroSection'
import BrandBar from '@/presentation/sections/BrandBar'
import ServicesSection from '@/presentation/sections/ServicesSection'
import HeritageSection from '@/presentation/sections/HeritageSection'
import ProjectsSection from '@/presentation/sections/ProjectsSection'
import ContactSection from '@/presentation/sections/ContactSection'
import Footer from '@/presentation/sections/Footer'

export default function HomePage() {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

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

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      setIsListening(false)

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
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [isListening])

  return (
    <>
      <Navigation onVoiceSearch={handleVoiceSearch} isListening={isListening} />

      <main className="relative">
        <HeroSection />
        <BrandBar />
        <ServicesSection />
        <HeritageSection />
        <ProjectsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  )
}
