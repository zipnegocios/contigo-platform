'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Mic, Menu, X } from 'lucide-react'
import { Button } from '@/presentation/design-system/components/atoms'

interface NavigationProps {
  onVoiceSearch: () => void
  isListening: boolean
}

export function Navigation({ onVoiceSearch, isListening }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
          scrolled ? 'nav-scrolled' : 'bg-transparent'
        }`}
        style={{ height: 72 }}
      >
        <div className="flex items-center justify-between h-full page-padding">
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} className="flex-shrink-0">
            <Image
              src="/assets/logo-secundario.png"
              alt="Contigo Constructions"
              width={140}
              height={40}
              style={{
                height: '2.5rem',
                width: 'auto',
                filter: scrolled ? 'none' : 'brightness(1.2)',
              }}
              priority
            />
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Services', id: 'services' },
              { label: 'Projects', id: 'projects' },
              { label: 'About', id: 'heritage' },
              { label: 'Contact', id: 'contact' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="relative text-sm font-medium transition-colors group"
                style={{
                  color: scrolled ? 'var(--contigo-foreground)' : 'var(--contigo-background)',
                }}
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: 'var(--contigo-primary)' }}
                />
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => scrollTo('contact')}
              variant="primary"
              size="md"
              className="hidden sm:inline-flex"
            >
              Get a Quote
            </Button>

            {/* Voice search button */}
            <button
              onClick={onVoiceSearch}
              className="relative p-2 rounded-full transition-colors"
              style={{
                color: scrolled ? 'var(--contigo-foreground)' : 'var(--contigo-background)',
                border: `1px solid ${scrolled ? 'var(--contigo-border)' : 'rgba(255,255,255,0.3)'}`,
              }}
              title="Voice search"
            >
              <Mic size={18} />
              {isListening && (
                <span
                  className="absolute inset-0 rounded-full voice-pulse"
                  style={{ border: '2px solid var(--contigo-primary)' }}
                />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: scrolled ? 'var(--contigo-foreground)' : 'var(--contigo-background)' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[110] w-80 transition-transform duration-500 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--contigo-background)' }}
      >
        <div className="flex flex-col pt-24 px-8 gap-6">
          {[
            { label: 'Services', id: 'services' },
            { label: 'Projects', id: 'projects' },
            { label: 'About', id: 'heritage' },
            { label: 'Contact', id: 'contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-left text-lg font-medium"
              style={{ color: 'var(--contigo-foreground)' }}
            >
              {item.label}
            </button>
          ))}
          <Button onClick={() => scrollTo('contact')} variant="primary" className="mt-4">
            Get a Quote
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[105] bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
