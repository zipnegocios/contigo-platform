'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/presentation/design-system/components/atoms'
import { logoPaths, LOGO_VIEWBOX } from './logo-paths'
import { ContactInfoModal } from './ContactInfoModal'
import { QuoteFormModal } from './QuoteFormModal'

const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
]

export function SimpleHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const past100 = window.scrollY > 100
      setScrolled((prev) => (prev === past100 ? prev : past100))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-[100] transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
          opacity: contactModalOpen || quoteModalOpen ? 0 : 1,
          pointerEvents: contactModalOpen || quoteModalOpen ? 'none' : 'auto',
          visibility: contactModalOpen || quoteModalOpen ? 'hidden' : 'visible',
        }}
      >
        <div
          className="flex items-center justify-between page-padding transition-all duration-500"
          style={{
            paddingTop: scrolled ? '0.75rem' : '1.5rem',
            paddingBottom: scrolled ? '0.75rem' : '1.5rem',
          }}
        >
          <Link href="/" className="flex-shrink-0">
            <svg
              viewBox={LOGO_VIEWBOX}
              xmlns="http://www.w3.org/2000/svg"
              style={{
                width: scrolled ? 'clamp(13rem, 16vw, 18rem)' : 'clamp(16rem, 20vw, 22rem)',
                height: 'auto',
                color: scrolled ? '#0D3C4C' : '#E2C063',
                transition: 'all 500ms',
              }}
            >
              <g fill="currentColor">{logoPaths}</g>
            </svg>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-fluid-sm font-medium transition-all duration-500 group"
                style={{
                  color: scrolled ? '#0d3c4c' : 'var(--contigo-background)',
                  opacity: scrolled ? 1 : 0.9,
                }}
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: 'var(--contigo-primary)' }}
                />
              </Link>
            ))}
            <button
              onClick={() => setContactModalOpen(true)}
              className="relative text-fluid-sm font-medium transition-all duration-500 group"
              style={{
                color: scrolled ? '#0d3c4c' : 'var(--contigo-background)',
                opacity: scrolled ? 1 : 0.9,
              }}
            >
              Contact
              <span
                className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: 'var(--contigo-primary)' }}
              />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setQuoteModalOpen(true)}
              variant="primary"
              size="md"
              className="hidden sm:inline-flex transition-all duration-500"
              style={{ opacity: scrolled ? 1 : 0.9, backgroundColor: '#E2C063', color: '#1E1A16' }}
            >
              Request a Quote
            </Button>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-500"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: scrolled ? '#0d3c4c' : 'rgba(255, 255, 255, 0.8)' }}
            >
              {mobileOpen ? (
                <X className="w-[clamp(1.25rem,3vw,1.75rem)] h-[clamp(1.25rem,3vw,1.75rem)]" />
              ) : (
                <Menu className="w-[clamp(1.25rem,3vw,1.75rem)] h-[clamp(1.25rem,3vw,1.75rem)]" />
              )}
            </button>
          </div>
        </div>
      </header>

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
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-left min-h-[44px] flex items-center text-fluid-lg font-medium transition-colors hover:text-contigo-primary"
              style={{ color: 'var(--contigo-foreground)' }}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false)
              setContactModalOpen(true)
            }}
            className="text-left min-h-[44px] flex items-center text-fluid-lg font-medium transition-colors hover:text-contigo-primary"
            style={{ color: 'var(--contigo-foreground)' }}
          >
            Contact
          </button>
          <Button
            onClick={() => {
              setMobileOpen(false)
              setQuoteModalOpen(true)
            }}
            variant="primary"
            className="mt-4"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            Request a Quote
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

      <ContactInfoModal open={contactModalOpen} onOpenChange={setContactModalOpen} />
      <QuoteFormModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </>
  )
}
