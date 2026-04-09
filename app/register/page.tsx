'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight, Check, Loader2, Mail } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'

// ---------- Plan display ----------

type PlanKey = 'monthly' | 'yearly' | 'one_time_dba'

const PLAN_DISPLAY: Record<PlanKey, { name: string; price: string; period: string }> = {
  monthly:      { name: 'Maandelijks',    price: '€20',   period: '/maand'  },
  yearly:       { name: 'Jaarlijks',      price: '€200',  period: '/jaar'   },
  one_time_dba: { name: 'Eenmalige check', price: '€9,95', period: 'eenmalig' },
}

function isPlanKey(key: string): key is PlanKey {
  return key in PLAN_DISPLAY
}

// ---------- Input helper ----------

function inputCls(error?: boolean) {
  return [
    'w-full h-11 rounded-xl border bg-background text-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
    'placeholder:text-muted-foreground/60',
    error ? 'border-red-400 bg-red-50/40' : 'border-border',
  ].join(' ')
}

// ---------- Main form ----------

function RegisterForm() {
  const searchParams = useSearchParams()

  const emailParam = searchParams.get('email') ?? ''
  const planParam  = searchParams.get('plan') ?? 'yearly'
  const plan: PlanKey = isPlanKey(planParam) ? planParam : 'yearly'
  const planInfo   = PLAN_DISPLAY[plan]

  const [email,    setEmail]    = useState(emailParam)
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [step,     setStep]     = useState<'form' | 'check_email'>('form')
  const [submitted, setSubmitted] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwOk    = password.length >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!emailOk || !pwOk) return

    setLoading(true)
    setError('')

    const supabase = createClient()

    // Build post-verification redirect URL
    const origin    = window.location.origin
    const nextPath  = `/checkout-redirect?plan=${plan}`
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    })

    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already in use')) {
        setError('Dit e-mailadres is al in gebruik. Log in via de inlogpagina.')
      } else {
        setError(`Er is een fout opgetreden: ${signUpError.message}`)
      }
      setLoading(false)
      return
    }

    // Session returned → email confirmation not required → trigger checkout directly
    if (data.session) {
      try {
        const endpoint = plan === 'one_time_dba'
          ? '/api/one-time/checkout'
          : '/api/billing/checkout'

        const body = plan === 'one_time_dba'
          ? {}
          : { plan }

        const res  = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
        const json = await res.json()

        if (json.url) {
          window.location.href = json.url
          return
        }

        setError('Checkout kon niet worden gestart. Ga naar je profiel om te upgraden.')
      } catch {
        setError('Er is een fout opgetreden bij het starten van de betaling.')
      }
      setLoading(false)
      return
    }

    // No session → email verification required
    setStep('check_email')
    setLoading(false)
  }

  // ---------- Check email screen ----------

  if (step === 'check_email') {
    return (
      <div className="w-full max-w-sm text-center space-y-6">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo variant="dark" className="h-10 w-auto" />
        </Link>

        <div className="glass-card p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Controleer je e-mail</h1>
          <p className="text-sm text-muted-foreground">
            We hebben een verificatielink gestuurd naar{' '}
            <strong className="text-foreground">{email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Na verificatie word je direct doorgestuurd naar Stripe om je{' '}
            <strong className="text-foreground">{planInfo.name}</strong>-abonnement
            ({planInfo.price}{planInfo.period}) te activeren.
          </p>
        </div>

        <button
          onClick={() => { setStep('form'); setSubmitted(false); setPassword('') }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Ander e-mailadres gebruiken
        </button>
      </div>
    )
  }

  // ---------- Registration form ----------

  return (
    <div className="w-full max-w-sm space-y-7">

      {/* Logo + title */}
      <div className="text-center">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo variant="dark" className="h-10 w-auto" />
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">Account aanmaken &amp; direct betalen</p>
      </div>

      {/* Selected plan badge */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gekozen plan</p>
          <p className="font-semibold text-foreground">{planInfo.name}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-foreground">{planInfo.price}</span>
          <span className="text-xs text-muted-foreground"> {planInfo.period}</span>
        </div>
      </div>

      {/* Form card */}
      <div className="glass-card rounded-2xl p-7 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className={`${inputCls(submitted && !emailOk)} pl-10 pr-4`}
              />
            </div>
            {submitted && !emailOk && (
              <p className="text-xs text-red-500">Voer een geldig e-mailadres in.</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimaal 10 tekens"
                className={`${inputCls(submitted && !pwOk)} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {submitted && !pwOk && (
              <p className="text-xs text-red-500">Wachtwoord moet minimaal 10 tekens zijn.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><span>Account aanmaken &amp; betalen</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Je wordt direct doorgestuurd naar Stripe voor een veilige betaling.
          </p>
        </form>

        <div className="pt-1 border-t border-border/40 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Al een account? Inloggen →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 hero-gradient">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="size-7 animate-spin text-primary/40" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </main>
  )
}
