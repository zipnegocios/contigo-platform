'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState, useId } from 'react'

export default function ForgotPasswordPage() {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6 py-12 sm:px-8"
      style={{ backgroundColor: 'var(--neutral-50, #FAF6F0)', fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" aria-label="Contigo Constructions — homepage" className="inline-block">
            <Image src="/assets/logo-principal.png" alt="Contigo Constructions" width={80} height={80} className="mx-auto object-contain" priority />
          </Link>
        </div>

        <div
          className="rounded-xl border p-6 sm:p-8"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE6DC' }}
        >
          <h1
            className="mb-1 text-center text-xl font-medium"
            style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)", color: '#2D2924' }}
          >
            Forgot your password?
          </h1>
          <p className="mb-6 text-center text-xs uppercase tracking-wide" style={{ color: '#A89E8C' }}>
            We&apos;ll email you a reset link
          </p>

          {submitted ? (
            <div className="text-center text-sm" style={{ color: '#2D2924' }}>
              <p>If an account exists for that email, a reset link is on its way.</p>
              <p className="mt-1" style={{ color: '#A89E8C' }}>The link expires in 30 minutes.</p>
              <Link href="/admin/login" className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide" style={{ color: '#C8A53C' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor={emailId}
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: '#7C7168' }}
              >
                Email Address
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@email.com"
                className="mb-6 w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#DDD5C8', color: '#2D2924' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="block w-full rounded-lg py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
                style={{ backgroundColor: '#E2C063', color: '#1A1510' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <Link
                href="/admin/login"
                className="mt-4 block text-center text-xs font-semibold uppercase tracking-wide"
                style={{ color: '#C8A53C' }}
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
