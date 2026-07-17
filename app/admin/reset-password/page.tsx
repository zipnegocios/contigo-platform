'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, Suspense, useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const passwordId = useId()
  const confirmId = useId()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'This reset link is invalid or has expired')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/login'), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center text-sm" style={{ color: '#2D2924' }}>
        <p>This reset link is missing its token.</p>
        <Link href="/admin/forgot-password" className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide" style={{ color: '#C8A53C' }}>
          Request a new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center text-sm" style={{ color: '#2D2924' }}>
        <p>Password updated. Redirecting to sign in…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          className="mb-4 rounded-lg border px-3 py-2 text-xs"
          style={{ backgroundColor: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#b91c1c' }}
        >
          {error}
        </div>
      )}

      <label htmlFor={passwordId} className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#7C7168' }}>
        New Password
      </label>
      <input
        id={passwordId}
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        disabled={loading}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded-lg border px-4 py-3 text-sm outline-none"
        style={{ borderColor: '#DDD5C8', color: '#2D2924' }}
      />

      <label htmlFor={confirmId} className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#7C7168' }}>
        Confirm Password
      </label>
      <input
        id={confirmId}
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        disabled={loading}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mb-2 w-full rounded-lg border px-4 py-3 text-sm outline-none"
        style={{ borderColor: '#DDD5C8', color: '#2D2924' }}
      />
      <p className="mb-6 text-xs" style={{ color: '#A89E8C' }}>
        At least 12 characters, with a letter and a number.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="block w-full rounded-lg py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        style={{ backgroundColor: '#E2C063', color: '#1A1510' }}
      >
        {loading ? 'Updating…' : 'Reset password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
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

        <div className="rounded-xl border p-6 sm:p-8" style={{ backgroundColor: '#FFFFFF', borderColor: '#EDE6DC' }}>
          <h1
            className="mb-1 text-center text-xl font-medium"
            style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)", color: '#2D2924' }}
          >
            Set a new password
          </h1>
          <p className="mb-6 text-center text-xs uppercase tracking-wide" style={{ color: '#A89E8C' }}>
            Choose something you haven&apos;t used before
          </p>

          <Suspense fallback={<div className="text-center text-sm" style={{ color: '#A89E8C' }}>Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
