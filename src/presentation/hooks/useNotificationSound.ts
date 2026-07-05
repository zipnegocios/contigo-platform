'use client'

import { useRef } from 'react'

/**
 * Manages a single lazily-created `HTMLAudioElement` for a notification
 * sound, handling the browser's autoplay-permission model.
 *
 * - `arm()` must be called synchronously inside a genuine user-gesture
 *   handler (e.g. a `click` listener). It creates the `Audio` instance if
 *   needed and immediately plays + pauses it, which "unlocks" the element so
 *   later programmatic (gesture-less) `.play()` calls from `play()` are
 *   allowed by the browser.
 * - `play()` is fire-and-forget: it never throws and never surfaces an
 *   unhandled promise rejection, even if the browser blocks the playback
 *   because no prior gesture armed it.
 *
 * Both functions are SSR-safe — the `Audio` constructor is only ever
 * invoked from within `arm()`/`play()`, never at module scope or during
 * render.
 */
export function useNotificationSound(src: string): { arm: () => void; play: () => void } {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const arm = () => {
    if (typeof window === 'undefined') {
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
    }
    const audio = audioRef.current
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {})
    }
    audio.pause()
    audio.currentTime = 0
  }

  const play = () => {
    if (typeof window === 'undefined') {
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
    }
    const audio = audioRef.current
    audio.currentTime = 0
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {})
    }
  }

  return { arm, play }
}
