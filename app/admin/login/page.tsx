'use client'

import Image from 'next/image'
import { FormEvent, Suspense, useState, useId } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── */
/* Eye icons — inline SVG, no external deps                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Login form                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const emailId      = useId()
  const passwordId   = useId()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [shake,    setShake]    = useState(false)

  const callbackUrl = searchParams?.get('callbackUrl') || '/admin'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    if (result?.ok) router.push(callbackUrl)
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    borderRadius: '8px',
    border: '1px solid #DDD5C8',
    backgroundColor: '#FFFFFF',
    color: '#2D2924',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E2C063'
    e.target.style.boxShadow   = '0 0 0 3px rgba(226,192,99,0.18)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#DDD5C8'
    e.target.style.boxShadow   = 'none'
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        animation: shake ? 'loginShake 0.5s ease' : 'none',
      }}
    >
      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(220,38,38,0.07)',
          border: '1px solid rgba(220,38,38,0.22)',
          color: '#c53030',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Email */}
      <div style={{ marginBottom: '1.1rem', animation: 'fadeUp 0.5s ease 0.35s both' }}>
        <label
          htmlFor={emailId}
          style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C7168' }}
        >
          Email Address
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="admin@contigoconstructions.com.au"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
          required
          style={{ ...inputBase, opacity: loading ? 0.6 : 1 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: '1.75rem', animation: 'fadeUp 0.5s ease 0.45s both' }}>
        <label
          htmlFor={passwordId}
          style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C7168' }}
        >
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={passwordId}
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            required
            style={{ ...inputBase, paddingRight: '3rem', opacity: loading ? 0.6 : 1 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#A89E8C',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'color 0.15s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E2C063'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#A89E8C'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}
          >
            {showPwd ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ animation: 'fadeUp 0.5s ease 0.55s both' }}>
        <button
          type="submit"
          disabled={loading}
          className="login-btn"
          style={{
            width: '100%',
            padding: '0.85rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#E2C063',
            color: '#1A1510',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#CDA93E'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(226,192,99,0.35)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#E2C063'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0) scale(0.98)' }}
          onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px) scale(1)' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Authenticating…
            </span>
          ) : 'Sign In'}
        </button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Page                                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function AdminLoginPage() {
  return (
    <>
      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginShake {
          0%,100% { transform: translateX(0); }
          15%     { transform: translateX(-6px); }
          30%     { transform: translateX(6px); }
          45%     { transform: translateX(-4px); }
          60%     { transform: translateX(4px); }
          75%     { transform: translateX(-2px); }
          90%     { transform: translateX(2px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes panelSlide {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes imagePan {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        /* Shimmer sweep on hover for submit */
        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0s;
        }
        .login-btn:hover:not(:disabled)::after {
          transform: translateX(100%);
          transition: transform 0.5s ease;
        }
        /* Responsive: stack on mobile */
        @media (max-width: 767px) {
          .login-split-left  { display: none !important; }
          .login-split-right { border-radius: 0 !important; min-height: 100dvh; }
          .login-mobile-bar  { display: flex !important; }
        }
        @media (min-width: 768px) {
          .login-mobile-bar { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100dvh', fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>

        {/* ── Mobile-only top bar ── */}
        <div
          className="login-mobile-bar"
          style={{
            display: 'none',
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: '64px',
            backgroundColor: '#1A1510',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderBottom: '1px solid rgba(226,192,99,0.15)',
          }}
        >
          <Image src="/assets/logo-secundario.png" alt="Contigo Constructions" width={160} height={36} className="object-contain" priority />
        </div>

        {/* ────────────────── LEFT — hero image panel ────────────────── */}
        <div
          className="login-split-left"
          style={{
            flex: '0 0 55%',
            position: 'relative',
            overflow: 'hidden',
            animation: 'imagePan 1s ease both',
          }}
        >
          {/* Background image */}
          <Image
            src="/assets/hero-test1.png"
            alt="Contigo Constructions project"
            fill
            priority
            sizes="55vw"
            className="object-cover"
            style={{ objectPosition: 'center 60%' }}
          />

          {/* Deep scrim */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(15,11,7,0.75) 0%, rgba(15,11,7,0.55) 60%, rgba(15,11,7,0.70) 100%)',
            zIndex: 1,
          }} />

          {/* Gold tint micro-overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(226,192,99,0.04) 0%, transparent 60%)',
            zIndex: 2,
          }} />

          {/* Content */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(2.5rem, 4vw, 3.5rem)',
          }}>
            {/* Logo at top — on light frosted pill */}
            <div>
              <div style={{
                display: 'inline-block',
                backgroundColor: 'rgba(250,246,240,0.92)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                padding: '0.6rem 1.2rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              }}>
                <Image src="/assets/logo-secundario.png" alt="Contigo Constructions" width={180} height={40} className="object-contain" priority />
              </div>
            </div>

            {/* Brand copy at bottom */}
            <div>
              <div style={{
                width: '40px', height: '1px',
                backgroundColor: '#E2C063',
                marginBottom: '1.5rem',
                opacity: 0.8,
              }} />
              <p style={{
                fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                fontStyle: 'italic',
                color: '#FAF6F0',
                lineHeight: 1.2,
                marginBottom: '1rem',
                fontWeight: 300,
              }}>
                Building Dreams<br />Together.
              </p>
              <p style={{
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(226,192,99,0.75)',
              }}>
                Adelaide, South Australia
              </p>
            </div>
          </div>
        </div>

        {/* ────────────────── RIGHT — form panel ────────────────── */}
        <div
          className="login-split-right"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: '#FAF6F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(5rem, 6vw, 4rem) clamp(2rem, 5vw, 3.5rem) clamp(2rem, 4vw, 3rem)',
            animation: 'panelSlide 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            position: 'relative',
          }}
        >
          {/* Subtle warm texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(226,192,99,0.06) 0%, transparent 60%)',
          }} />

          <div style={{ position: 'relative', maxWidth: '360px', width: '100%', margin: '0 auto' }}>

            {/* Logo — sits naturally on the cream bg */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeUp 0.5s ease 0.2s both' }}>
              <Image
                src="/assets/logo-principal.png"
                alt="Contigo Constructions"
                width={110}
                height={110}
                className="object-contain"
                priority
              />
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeUp 0.5s ease 0.28s both' }}>
              <h1 style={{
                fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                fontSize: '1.65rem',
                fontWeight: 500,
                color: '#2D2924',
                marginBottom: '0.3rem',
                letterSpacing: '0.01em',
              }}>
                Administration Portal
              </h1>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A89E8C' }}>
                Authorised personnel only
              </p>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1.75rem',
              animation: 'fadeUp 0.5s ease 0.32s both',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5DDD0' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E2C063', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5DDD0' }} />
            </div>

            {/* Form */}
            <Suspense fallback={
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#A89E8C', fontSize: '0.85rem' }}>
                Loading…
              </div>
            }>
              <LoginForm />
            </Suspense>

            {/* Credits */}
            <div style={{
              marginTop: '2.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #EDE6DC',
              animation: 'fadeUp 0.5s ease 0.65s both',
            }}>
              <p style={{ fontSize: '0.68rem', color: '#B8AFA4', lineHeight: 1.7, textAlign: 'center' }}>
                Platform Web developed by{' '}
                <a
                  href="https://zipnegocios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#C8A53C', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#E2C063')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#C8A53C')}
                >
                  zipnegocios
                </a>
              </p>
              <p style={{ fontSize: '0.68rem', color: '#B8AFA4', lineHeight: 1.7, textAlign: 'center' }}>
                Support &amp; Engineering{' '}
                <a
                  href="https://wa.me/13164695701"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#C8A53C', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#E2C063')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#C8A53C')}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  Gustavo Amarista
                </a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
