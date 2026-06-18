'use client'

import { createContext, useContext, useRef, useMemo, ReactNode } from 'react'

interface LogoMorphContextType {
  setHeroDockRef: (el: HTMLDivElement | null) => void
  setNavDockDesktopRef: (el: HTMLDivElement | null) => void
  setNavDockMobileRef: (el: HTMLDivElement | null) => void
  heroDockRef: React.RefObject<HTMLDivElement | null>
  navDockDesktopRef: React.RefObject<HTMLDivElement | null>
  navDockMobileRef: React.RefObject<HTMLDivElement | null>
}

const LogoMorphContext = createContext<LogoMorphContextType | undefined>(undefined)

export function LogoMorphProvider({ children }: { children: ReactNode }) {
  const heroDockRef = useRef<HTMLDivElement | null>(null)
  const navDockDesktopRef = useRef<HTMLDivElement | null>(null)
  const navDockMobileRef = useRef<HTMLDivElement | null>(null)

  // NOTE: live scroll progress (0→1) is intentionally NOT React state.
  // It used to be (`progress` + `setProgress` published as
  // `window.__setLogoMorphProgress`), which meant every single
  // ScrollTrigger tick called setState and re-rendered this Provider
  // plus every consumer (Navigation, HeroSection) — a re-render-per-frame
  // storm during the whole scroll-morph range, and nothing even read the
  // resulting `progress` value for rendering. Progress now lives on
  // `window.__logoMorphProgress`, written directly (no setState) by
  // useScrollLogoMorph.ts inside the same GSAP tick that moves the logo.
  // This context only carries the dock refs, whose identity never
  // changes, so consumers never re-render because of this provider.
  const value = useMemo<LogoMorphContextType>(
    () => ({
      setHeroDockRef: (el) => {
        heroDockRef.current = el
      },
      setNavDockDesktopRef: (el) => {
        navDockDesktopRef.current = el
      },
      setNavDockMobileRef: (el) => {
        navDockMobileRef.current = el
      },
      heroDockRef,
      navDockDesktopRef,
      navDockMobileRef,
    }),
    []
  )

  return <LogoMorphContext.Provider value={value}>{children}</LogoMorphContext.Provider>
}

export function useLogoMorphContext() {
  const context = useContext(LogoMorphContext)
  if (!context) {
    throw new Error('useLogoMorphContext must be used within LogoMorphProvider')
  }
  return context
}
