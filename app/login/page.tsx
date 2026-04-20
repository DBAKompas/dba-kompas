'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check, AlertTriangle } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import Link from 'next/link'
import { EmailCheckoutModal } from '@/components/marketing/EmailCheckoutModal'

/**
 * Parseert Supabase auth-callback-errors die via querystring of hash-fragment
 * op /login terechtkomen. Supabase zet `otp_expired` typisch in `location.hash`
 * (bv. `#error=access_denied&error_code=otp_expired&...`); onze eigen callback
 * vult de querystring met `?error=auth_callback_error`.
 * Retourneert een kort, gebruikersvriendelijk bericht of `null`.
 */
function readAuthNotice(searchParams: URLSearchParams, hash: string): string | null {
  const qsError = searchParams.get('error')
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const hashErrorCode = hashParams.get('error_code')
  const hashError = hashParams.get('error')

  if (hashErrorCode === 'otp_expired') {
    return 'Je inloglink is verlopen of al eerder gebruikt. Vraag hieronder een nieuwe aan.'
  }
  if (hashError || qsError === 'auth_callback_error') {
    return 'Inloggen via deze link lukte niet. Vraag hieronder een nieuwe inloglink aan.'
  }
  return null
}

function inputCls(error?: boolean) {
  return [
    'w-full h-11 rounded-xl border bg-background text-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
    'placeholder:text-muted-foreground/60',
    error
      ? 'border-red-400 bg-red-50/40'
      : 'border-border',
    'pl-10 pr-4',
  ].join(' ')
}

function LoginPageContent() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [sent, setSent]               = useState(false)
  const [mode, setMode]               = useState<'password' | 'magic'>('password')
  const [error, setError]             = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const supabase = createClient()
  const router   = useRouter()
  const posthog  = usePostHog()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  // Detecteer auth-callback-errors (querystring + hash) en switch direct
  // naar de magic-link flow zodat de klant alleen nog maar op "Stuur
  // inloglink" hoeft te klikken. (KI-020-A herstelpad.)
  useEffect(() => {
    const notice = readAuthNotice(
      searchParams,
      typeof window !== 'undefined' ? window.location.hash : '',
    )
    if (notice) {
      setAuthNotice(notice)
      setMode('magic')
      // Ruim hash op zodat een pagina-refresh niet opnieuw de banner toont.
      if (typeof window !== 'undefined' && window.location.hash) {
        const clean =
          window.location.pathname + (window.location.search ?? '')
        window.history.replaceState(null, '', clean)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'password') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Ongeldig e-mailadres of wachtwoord.')
      } else {
        if (data.user) {
          posthog?.identify(data.user.id, { email: data.user.email })
          posthog?.capture('login_completed', {
            user_id: data.user.id,
            account_id: data.user.id,
            login_method: 'password',
          })
        }
        router.push(nextPath)
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (!error) setSent(true)
      else setError('Er ging iets mis. Probeer opnieuw.')
    }
    setLoading(false)
  }

  /* ── Magic link bevestiging ── */
  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo variant="dark" className="h-10 w-auto" />
          </Link>
          <div className="glass-card p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Controleer je e-mail</h1>
            <p className="text-sm text-muted-foreground">
              We hebben een inloglink gestuurd naar <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Ander e-mailadres gebruiken
          </button>
        </div>
      </main>
    )
  }

  /* ── Login formulier ── */
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 hero-gradient">
      <div className="w-full max-w-sm space-y-7">

        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo variant="dark" className="h-10 w-auto" />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === 'password' ? 'Log in op je account' : 'Ontvang een inloglink per e-mail'}
          </p>
        </div>

        {/* Auth callback notice (otp_expired / auth_callback_error) */}
        {authNotice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Inloglink werkte niet</p>
              <p className="text-xs leading-relaxed">{authNotice}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass-card rounded-2xl p-7 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">E-mailadres</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="jouw@email.nl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Wachtwoord */}
            {mode === 'password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Wachtwoord</label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-accent transition-colors">Wachtwoord vergeten?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={`${inputCls()} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Foutmelding */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Knop */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
            >
              {loading
                ? 'Bezig...'
                : mode === 'password'
                  ? <><span>Inloggen</span> <ArrowRight className="w-4 h-4" /></>
                  : 'Stuur inloglink'
              }
            </button>
          </form>

          {/* Magic link toggle */}
          <div className="pt-1 border-t border-border/40 text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError('') }}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {mode === 'password' ? 'Liever inloggen met magic link?' : 'Liever inloggen met wachtwoord?'}
            </button>
          </div>
        </div>

        {/* Nog geen account */}
        <p className="text-center text-sm text-muted-foreground">
          Nog geen account?{' '}
          <button
            onClick={() => setCheckoutOpen(true)}
            className="font-semibold text-foreground hover:text-accent transition-colors"
          >
            Bekijk de abonnementen
          </button>
        </p>
      </div>

      {/* Abonnement modal */}
      {checkoutOpen && (
        <EmailCheckoutModal
          preselectedPlan="yearly"
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
