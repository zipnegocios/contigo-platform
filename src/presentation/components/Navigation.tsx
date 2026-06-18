'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Menu, X } from 'lucide-react'
import { Button } from '@/presentation/design-system/components/atoms'
import { useLogoMorphContext } from '@/presentation/providers/LogoMorphProvider'

interface NavigationProps {
  onVoiceSearch: () => void
  isListening: boolean
}

export function Navigation({ onVoiceSearch, isListening }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null)
  const context = useLogoMorphContext()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Backdrop/blur threshold only. The grid's logo-dock column width is no
  // longer React state — it's written straight to the
  // `--nav-left-track-width` CSS variable by useScrollLogoMorph.ts, in the
  // same GSAP tick that moves the logo itself, so the two never desync and
  // this component doesn't re-render on every scroll event.
  useEffect(() => {
    const handleScroll = () => {
      const past100 = window.scrollY > 100
      setScrolled(prev => (prev === past100 ? prev : past100))
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
        className="fixed top-0 left-0 w-full z-[100] transition-all duration-500"
        style={{
          height: scrolled ? 80 : 'auto',
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div
          className="grid items-center page-padding transition-all duration-500"
          style={{
            gridTemplateColumns: 'var(--nav-left-track-width, 0px) 1fr auto',
            height: scrolled ? '100%' : 'auto',
            paddingTop: scrolled ? 0 : '1.5rem',
            paddingBottom: scrolled ? 0 : '1.5rem',
          }}
        >
          {/* Logo dock — desktop */}
          <div
            ref={(el) => context.setNavDockDesktopRef(el)}
            className="hidden lg:block flex-shrink-0"
            style={{
              width: 'clamp(5rem, 7vw, 7rem)',
              aspectRatio: '1024 / 354.041',
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />

          {/* Logo dock — mobile (centered) */}
          <div
            ref={(el) => context.setNavDockMobileRef(el)}
            className="lg:hidden flex justify-center flex-shrink-0 absolute left-1/2"
            style={{
              transform: 'translateX(-50%)',
              width: 'clamp(4.5rem, 10vw, 6rem)',
              aspectRatio: '1024 / 354.041',
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center justify-center gap-8 transition-all duration-500">
            {[
              { label: 'Services', id: 'services' },
              { label: 'Projects', id: 'projects' },
              { label: 'About', id: 'heritage' },
              { label: 'Contact', id: 'contact' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="relative text-sm font-medium transition-all duration-500 group"
                style={{
                  color: scrolled ? '#0d3c4c' : 'var(--contigo-background)',
                  opacity: scrolled ? 1 : 0.9,
                  fontSize: '0.95rem',
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
          <div className="flex items-center justify-end gap-4 transition-all duration-500">
            <Button
              onClick={() => scrollTo('contact')}
              variant="primary"
              size="md"
              className="hidden sm:inline-flex transition-all duration-500"
              style={{
                opacity: scrolled ? 1 : 0.9,
                fontSize: '1rem',
                padding: '0.5rem 1.25rem',
              }}
            >
              Get a Quote
            </Button>

            {/* Voice search button */}
            <button
              onClick={onVoiceSearch}
              className="relative p-2.5 rounded-full transition-all duration-500"
              style={{
                color: scrolled ? '#0d3c4c' : 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${scrolled ? 'rgba(13, 60, 76, 0.2)' : 'rgba(255,255,255,0.3)'}`,
              }}
              title="Voice search"
            >
              <Mic size={scrolled ? 20 : 22} />
              {isListening && (
                <span
                  className="absolute inset-0 rounded-full voice-pulse"
                  style={{ border: '2px solid var(--contigo-primary)' }}
                />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 transition-all duration-500"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: scrolled ? '#0d3c4c' : 'rgba(255, 255, 255, 0.8)' }}
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
        style={{
          backgroundColor: 'var(--contigo-background)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex flex-col pt-32 px-8 gap-6 sm:pt-24">
          {[
            { label: 'Services', id: 'services' },
            { label: 'Projects', id: 'projects' },
            { label: 'About', id: 'heritage' },
            { label: 'Contact', id: 'contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-left text-lg font-medium transition-colors hover:text-contigo-primary"
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
