'use client'

import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react'

interface LogoMorphContextType {
  progress: number
  setHeroDockRef: (el: HTMLDivElement | null) => void
  setNavDockDesktopRef: (el: HTMLDivElement | null) => void
  setNavDockMobileRef: (el: HTMLDivElement | null) => void
  heroDockRef: React.MutableRefObject<HTMLDivElement | null>
  navDockDesktopRef: React.MutableRefObject<HTMLDivElement | null>
  navDockMobileRef: React.MutableRefObject<HTMLDivElement | null>
}

const LogoMorphContext = createContext<LogoMorphContextType | undefined>(undefined)

export function LogoMorphProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0)
  const heroDockRef = useRef<HTMLDivElement | null>(null)
  const navDockDesktopRef = useRef<HTMLDivElement | null>(null)
  const navDockMobileRef = useRef<HTMLDivElement | null>(null)

  const setHeroDockRef = useCallback((el: HTMLDivElement | null) => {
    heroDockRef.current = el
  }, [])

  const setNavDockDesktopRef = useCallback((el: HTMLDivElement | null) => {
    navDockDesktopRef.current = el
  }, [])

  const setNavDockMobileRef = useCallback((el: HTMLDivElement | null) => {
    navDockMobileRef.current = el
  }, [])

  const value: LogoMorphContextType = {
    progress,
    setHeroDockRef,
    setNavDockDesktopRef,
    setNavDockMobileRef,
    heroDockRef,
    navDockDesktopRef,
    navDockMobileRef,
  }

  // Expose setProgress globally for the hook to update it
  useEffect(() => {
    ;(window as any).__setLogoMorphProgress = setProgress
  }, [setProgress])

  return (
    <LogoMorphContext.Provider value={value}>{children}</LogoMorphContext.Provider>
  )
}

export function useLogoMorphContext() {
  const context = useContext(LogoMorphContext)
  if (!context) {
    throw new Error('useLogoMorphContext must be used within LogoMorphProvider')
  }
  return context
}
