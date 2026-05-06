'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

type Props = { token: string }

export function WelcomeForm({ token }: Props) {
  const router = useRouter()
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const tryRender = () => {
      if (cancelled) return
      if (!window.turnstile || !widgetRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: SITE_KEY,
        size: 'normal',
      })
    }
    const id = window.setInterval(tryRender, 200)
    tryRender()
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const cfTurnstileToken = window.turnstile?.getResponse(widgetIdRef.current ?? undefined)
      const res = await fetch('/api/onboarding/welcome-link/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          cfTurnstileToken,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!data || data.ok !== true) {
        window.turnstile?.reset(widgetIdRef.current ?? undefined)
        setError('Er ging iets mis. Controleer je gegevens (wachtwoord minimaal 10 tekens) en probeer opnieuw, of neem contact op met support als het blijft mislukken.')
        setSubmitting(false)
        return
      }
      const supabase = createClient()
      const signIn = await supabase.auth.signInWithPassword({ email: data.email, password })
      if (signIn.error) {
        setError('Account is aangemaakt, maar inloggen lukte niet. Probeer in te loggen via de loginpagina.')
        setSubmitting(false)
        return
      }
      router.replace(`/c/${token}/welkom-bedankt`)
    } catch {
      window.turnstile?.reset(widgetIdRef.current ?? undefined)
      setError('Er ging iets mis. Probeer het opnieuw.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Voornaam</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Achternaam</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mailadres</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
          <input
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Minimaal 10 tekens.</p>
        </div>
        <div ref={widgetRef} className="flex justify-center" />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 disabled:opacity-60"
        >
          {submitting ? 'Bezig...' : 'Activeer mijn gratis DBA Check'}
        </button>
        <p className="text-xs text-slate-500 text-center">
          Beschermd met Cloudflare Turnstile.
        </p>
      </form>
    </>
  )
}
