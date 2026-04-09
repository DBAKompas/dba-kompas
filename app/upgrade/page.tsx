'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    key: 'one_time_dba' as const,
    name: 'Eenmalige check',
    sub: 'Geen abonnement',
    price: '€9,95',
    period: 'eenmalig',
    badge: null,
    features: [
      '1 opdrachtomschrijving toetsen',
      'Heranalyse binnen dezelfde check',
      'Risico-indicatie en aandachtspunten',
      'Herschreven opdrachtbrief (Word-download)',
    ],
  },
  {
    key: 'monthly' as const,
    name: 'Maandelijks',
    sub: 'Flexibel opzegbaar',
    price: '€20',
    period: '/maand',
    badge: null,
    features: [
      'Onbeperkt analyses',
      'Heranalyse en bijsturen',
      'Risico-indicatie en aandachtspunten',
      'Herschreven opdrachtbrief (Word-download)',
      'Toegang tot volledige app',
    ],
  },
  {
    key: 'yearly' as const,
    name: 'Jaarlijks',
    sub: 'Beste waarde',
    price: '€200',
    period: '/jaar',
    badge: 'Bespaar 17%',
    features: [
      'Onbeperkt analyses',
      'Heranalyse en bijsturen',
      'Risico-indicatie en aandachtspunten',
      'Herschreven opdrachtbrief (Word-download)',
      'Toegang tot volledige app',
    ],
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChoosePlan(planKey: string) {
    setLoadingPlan(planKey)
    setError(null)

    try {
      const endpoint = planKey === 'one_time_dba' ? '/api/one-time/checkout' : '/api/billing/checkout'
      const body = planKey === 'one_time_dba' ? {} : { plan: planKey }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (json.url) {
        window.location.href = json.url
      } else {
        setError('Er is iets misgegaan. Probeer het opnieuw.')
        setLoadingPlan(null)
      }
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
      setLoadingPlan(null)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center px-4 py-16">

      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="text-2xl font-extrabold tracking-tight text-foreground">
          <span className="text-accent">DBA</span>Kompas
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">Kies een plan om door te gaan</h1>
        <p className="text-muted-foreground text-base max-w-md">
          Je hebt nog geen actief abonnement of aankoop. Kies hieronder een plan om toegang te krijgen tot DBA Kompas.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="bg-card rounded-2xl border border-border/60 p-6 flex flex-col shadow-sm"
          >
            {plan.badge && (
              <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-accent text-white text-xs font-bold w-fit">
                {plan.badge}
              </span>
            )}
            <div className="mb-1">
              <p className="font-bold text-foreground text-lg">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{plan.sub}</p>
            </div>
            <div className="my-4">
              <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground"> {plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleChoosePlan(plan.key)}
              disabled={loadingPlan !== null}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
            >
              {loadingPlan === plan.key
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Kies dit plan <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-500">{error}</p>
      )}

      {/* Footer */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <button
          onClick={handleLogout}
          className="hover:text-foreground transition-colors underline underline-offset-2"
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}
