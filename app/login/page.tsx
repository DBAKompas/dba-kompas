'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import Link from 'next/link'
import { EmailCheckoutModal } from '@/components/marketing/EmailCheckoutModal'

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
  const supabase = createClient()
  const router   = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Ongeldig e-mailadres of wachtwoord.')
      } else {
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
