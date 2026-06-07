'use client'

import Image from 'next/image'
import { FormEvent, Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/presentation/components/ui/input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams?.get('callbackUrl') || '/admin'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setIsLoading(false)
      return
    }

    if (result?.ok) {
      router.push(callbackUrl)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6560' }}>
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="admin@contigoconstructions.com.au"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className="bg-white"
          style={{ borderColor: '#E5DDD0', outline: 'none' }}
          onFocus={(e) => { e.target.style.borderColor = '#E2C063'; e.target.style.boxShadow = '0 0 0 3px rgba(226,192,99,0.15)' }}
          onBlur={(e) => { e.target.style.borderColor = '#E5DDD0'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6560' }}>
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          className="bg-white"
          style={{ borderColor: '#E5DDD0' }}
          onFocus={(e) => { e.target.style.borderColor = '#E2C063'; e.target.style.boxShadow = '0 0 0 3px rgba(226,192,99,0.15)' }}
          onBlur={(e) => { e.target.style.borderColor = '#E5DDD0'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 mt-2"
        style={{
          backgroundColor: isLoading ? '#C8A55C' : '#E2C063',
          color: '#1E1A16',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = '#D4AF37' }}
        onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = '#E2C063' }}
      >
        {isLoading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#1E1A16' }}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #E2C063 0, #E2C063 1px, transparent 0, transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-principal.png"
            alt="Contigo Constructions"
            width={200}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{
            backgroundColor: '#FAF6F0',
            border: '1px solid rgba(226, 192, 99, 0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          <div className="mb-6 text-center">
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}
            >
              Administration Portal
            </h1>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: '#A89E8C' }}>
              Contigo Constructions
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-sm py-4" style={{ color: '#6B6560' }}>Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(168,158,140,0.6)' }}>
          Authorised personnel only
        </p>
      </div>
    </div>
  )
}
