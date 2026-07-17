'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, Suspense, useState, useId } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── */
/* SVG icons                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
function EyeOpen() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Form                                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

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
    padding: '0.72rem 1rem',
    fontSize: '0.875rem',
    borderRadius: '8px',
    border: '1.5px solid #DDD5C8',
    backgroundColor: '#FFFFFF',
    color: '#2D2924',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E2C063'
    e.target.style.boxShadow = '0 0 0 3px rgba(226,192,99,0.16)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#DDD5C8'
    e.target.style.boxShadow = 'none'
  }

  return (
    <form onSubmit={handleSubmit} style={{ animation: shake ? 'loginShake 0.5s ease' : 'none' }}>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: '1.1rem', padding: '0.7rem 0.9rem', borderRadius: '8px',
          backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
          color: '#b91c1c', fontSize: '0.8rem', lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: '0.45rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Email */}
      <div style={{ marginBottom: '1rem', animation: 'fadeUp 0.45s ease 0.3s both' }}>
        <label htmlFor={emailId} style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C7168' }}>
          Email Address
        </label>
        <input
          id={emailId} type="email" autoComplete="email"
          placeholder="user@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          disabled={loading} required
          style={{ ...inputBase, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'text' }}
          onFocus={onFocus} onBlur={onBlur}
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: '1.5rem', animation: 'fadeUp 0.45s ease 0.4s both' }}>
        <label htmlFor={passwordId} style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C7168' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={passwordId} type={showPwd ? 'text' : 'password'} autoComplete="current-password"
            placeholder="••••••••••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            disabled={loading} required
            style={{ ...inputBase, paddingRight: '2.8rem', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'text' }}
            onFocus={onFocus} onBlur={onBlur}
          />
          {/* Eye toggle */}
          <button
            type="button"
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            onClick={() => setShowPwd(v => !v)}
            className="eye-btn"
          >
            {showPwd ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ animation: 'fadeUp 0.45s ease 0.5s both' }}>
        <button type="submit" disabled={loading} className="login-btn">
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.75s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Authenticating…
            </span>
            : 'Sign In'
          }
        </button>
      </div>

      {/* Forgot password */}
      <div style={{ textAlign: 'center', marginTop: '1rem', animation: 'fadeUp 0.45s ease 0.55s both' }}>
        <Link href="/admin/forgot-password" className="credit-link" style={{ fontSize: '0.75rem' }}>
          Forgot your password?
        </Link>
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
      <style>{`
        /* ── Keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-3px); }
          60% { transform: translateX(3px); }
          80% { transform: translateX(-1px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes imageIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Submit button ── */
        .login-btn {
          display: block;
          width: 100%;
          padding: 0.82rem 1.5rem;
          border-radius: 8px;
          border: none;
          background-color: #E2C063;
          color: #1A1510;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }
        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .login-btn:not(:disabled):hover {
          background-color: #CDA93E;
          box-shadow: 0 4px 18px rgba(226,192,99,0.32);
          transform: translateY(-1px);
        }
        .login-btn:not(:disabled):active {
          transform: translateY(0) scale(0.98);
        }
        /* Shimmer sweep */
        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.3) 50%, transparent 62%);
          transform: translateX(-100%);
          transition: transform 0s;
        }
        .login-btn:not(:disabled):hover::after {
          transform: translateX(100%);
          transition: transform 0.5s ease;
        }

        /* ── Eye toggle ── */
        .eye-btn {
          position: absolute;
          right: 0.7rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0.3rem;
          border-radius: 4px;
          cursor: pointer;
          color: #B0A598;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease, transform 0.18s ease;
          line-height: 0;
        }
        .eye-btn:hover {
          color: #E2C063;
          transform: translateY(-50%) scale(1.18);
        }

        /* ── Responsive split ── */

        /* Mini-laptop / small desktop: narrow the image panel */
        @media (max-width: 1100px) {
          .split-left  { flex: 0 0 48% !important; }
        }
        @media (max-width: 960px) {
          .split-left  { flex: 0 0 44% !important; }
        }
        /* Tablet / mobile: hide image, show full form */
        @media (max-width: 767px) {
          .split-left       { display: none !important; }
          .split-right      {
            min-height: 100dvh;
            padding-top: clamp(2.5rem, 8vw, 4rem) !important;
            padding-bottom: clamp(2rem, 5vw, 3rem) !important;
          }
          .form-inner       { max-width: 100% !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100dvh', fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>

        {/* ─────────── LEFT: image panel ─────────── */}
        <div
          className="split-left"
          style={{
            flex: '0 0 52%',
            position: 'relative',
            overflow: 'hidden',
            animation: 'imageIn 1s ease both',
          }}
        >
          <Image
            src="/assets/hero-test1.png"
            alt="Contigo Constructions project"
            fill priority sizes="55vw"
            className="object-cover"
            style={{ objectPosition: 'center 55%' }}
          />
          {/* Dark scrim */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(150deg, rgba(12,9,6,0.70) 0%, rgba(12,9,6,0.50) 55%, rgba(12,9,6,0.72) 100%)',
            zIndex: 1,
          }} />
          {/* Gold warm tint */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(226,192,99,0.07) 0%, transparent 50%)',
            zIndex: 2,
          }} />

          {/* Text content — no logo here */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: 'clamp(2rem, 3.5vw, 3.5rem)',
          }}>
            <div style={{ width: '36px', height: '1.5px', backgroundColor: '#E2C063', marginBottom: '1.4rem', opacity: 0.85 }} />
            <p style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
              fontSize: 'clamp(1.9rem, 2.8vw, 2.75rem)',
              fontStyle: 'italic',
              color: '#FAF6F0',
              lineHeight: 1.2,
              marginBottom: '0.9rem',
              fontWeight: 300,
            }}>
              Building Dreams<br />Together.
            </p>
            <p style={{
              fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(226,192,99,0.72)',
            }}>
              Adelaide, South Australia
            </p>
          </div>
        </div>

        {/* ─────────── RIGHT: form panel ─────────── */}
        <div
          className="split-right"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: '#FAF6F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.75rem, 4vw, 3.5rem)',
            animation: 'panelIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            position: 'relative',
          }}
        >
          {/* Subtle warm radial */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(ellipse at 75% 15%, rgba(226,192,99,0.07) 0%, transparent 55%)',
          }} />

          <div className="form-inner" style={{ position: 'relative', maxWidth: '340px', width: '100%', margin: '0 auto' }}>

            {/* Logo → links to homepage */}
            <div style={{ textAlign: 'center', marginBottom: '1.6rem', animation: 'fadeUp 0.45s ease 0.15s both' }}>
              <Link href="/" aria-label="Contigo Constructions — homepage" style={{ display: 'inline-block', transition: 'opacity 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Image
                  src="/assets/logo-principal.png"
                  alt="Contigo Constructions"
                  width={96} height={96}
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.6rem', animation: 'fadeUp 0.45s ease 0.22s both' }}>
              <h1 style={{
                fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                fontSize: 'clamp(1.4rem, 2.5vw, 1.65rem)',
                fontWeight: 500, color: '#2D2924', marginBottom: '0.3rem', letterSpacing: '0.01em',
              }}>
                Administration Portal
              </h1>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#A89E8C' }}>
                Authorised personnel only
              </p>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              marginBottom: '1.6rem',
              animation: 'fadeUp 0.45s ease 0.27s both',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5DDD0' }} />
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#E2C063', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5DDD0' }} />
            </div>

            {/* Form */}
            <Suspense fallback={
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#A89E8C', fontSize: '0.83rem' }}>
                Loading…
              </div>
            }>
              <LoginForm />
            </Suspense>

            {/* Credits */}
            <div style={{
              marginTop: '2rem', paddingTop: '1.25rem',
              borderTop: '1px solid #EDE6DC',
              animation: 'fadeUp 0.45s ease 0.6s both',
            }}>
              <p style={{ fontSize: '0.66rem', color: '#BFB6AB', lineHeight: 1.75, textAlign: 'center' }}>
                Platform Web developed by{' '}
                <a href="https://zipnegocios.com" target="_blank" rel="noopener noreferrer"
                  className="credit-link">zipnegocios</a>
              </p>
              <p style={{ fontSize: '0.66rem', color: '#BFB6AB', lineHeight: 1.75, textAlign: 'center' }}>
                Support &amp; Engineering{' '}
                <a href="https://wa.me/13164695701" target="_blank" rel="noopener noreferrer"
                  className="credit-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.22rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  Gustavo Amarista
                </a>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Credit link styles isolated here to avoid class conflicts */}
      <style>{`
        .credit-link {
          color: #C8A53C;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .credit-link:hover { color: #E2C063; }
      `}</style>
    </>
  )
}
