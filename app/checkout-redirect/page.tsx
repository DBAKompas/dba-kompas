'use client'

/**
 * /checkout-redirect
 *
 * Automatische checkout-trigger na e-mailverificatie.
 *
 * Gebruiksscenario:
 *   /auth/callback?next=/checkout-redirect?plan=monthly
 *
 * De pagina leest het plan uit de URL-params, roept de juiste checkout
 * API aan en stuurt de gebruiker direct door naar Stripe.
 * Bij een fout wordt een duidelijke foutmelding getoond.
 */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertTriangle } from 'lucide-react'

type PlanKey = 'monthly' | 'yearly' | 'one_time_dba'

function isPlanKey(key: string): key is PlanKey {
  return ['monthly', 'yearly', 'one_time_dba'].includes(key)
}

function CheckoutRedirectInner() {
  const searchParams = useSearchParams()
  const rawPlan      = searchParams.get('plan') ?? 'yearly'
  const plan: PlanKey = isPlanKey(rawPlan) ? rawPlan : 'yearly'

  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function triggerCheckout() {
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

        if (cancelled) return

        const data = await res.json()

        if (data.url) {
          window.location.href = data.url
          return
        }

        setError(data.error ?? 'Checkout kon niet worden gestart.')
      } catch {
        if (!cancelled) setError('Er is een verbindingsfout opgetreden.')
      }
    }

    triggerCheckout()
    return () => { cancelled = true }
  }, [plan])

  if (error) {
    return (
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="glass-card p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Checkout mislukt</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Je account is wel aangemaakt. Log in en upgrade via je profiel.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
        >
          Ga naar dashboard →
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      <p className="text-sm text-muted-foreground">Je wordt doorgestuurd naar Stripe...</p>
    </div>
  )
}

export default function CheckoutRedirectPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="size-7 animate-spin text-primary/40" />
        </div>
      }>
        <CheckoutRedirectInner />
      </Suspense>
    </main>
  )
}
