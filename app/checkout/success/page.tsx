/**
 * /checkout/success - bevestiging na Stripe guest-checkout (KI-020).
 *
 * Deze pagina is de success_url voor zowel `/api/billing/checkout-guest`
 * (subscription) als `/api/one-time/checkout-guest` (eenmalige aankoop).
 * De bezoeker is NIET ingelogd op het moment van landing: de Stripe webhook
 * provisioneert pas achter de schermen de Supabase user en stuurt via
 * Postmark een welkomstmail met magic link. Deze pagina legt dat uit,
 * zodat de gebruiker niet ten onrechte op /login belandt en denkt dat
 * er iets mis ging.
 *
 * Zie ook: app/api/billing/webhook/route.ts (provisioning + mail),
 *          lib/auth/provision-user.ts (user-aanmaak + magic link),
 *          modules/email/send.ts (Postmark-welkomstmail).
 */

import Link from 'next/link'
import { Mail, Check } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import { PurchaseTracker } from '@/components/analytics/PurchaseTracker'

type PlanKey = 'monthly' | 'yearly' | 'one_time'

const PLAN_COPY: Record<PlanKey, { name: string; price: string; period: string }> = {
  monthly:  { name: 'Maandelijks',    price: '€20',   period: '/maand'  },
  yearly:   { name: 'Jaarlijks',      price: '€200',  period: '/jaar'   },
  one_time: { name: 'Eenmalige check', price: '€9,95', period: 'eenmalig' },
}

function isPlanKey(key: string | undefined): key is PlanKey {
  return key === 'monthly' || key === 'yearly' || key === 'one_time'
}

type SearchParams = Promise<{ plan?: string; session_id?: string }>

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const planParam = params.plan
  const plan: PlanKey = isPlanKey(planParam) ? planParam : 'one_time'
  const planInfo = PLAN_COPY[plan]

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 hero-gradient">
      <div className="w-full max-w-md text-center space-y-6">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo variant="dark" className="h-10 w-auto" />
        </Link>

        <div className="glass-card p-8 space-y-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Betaling gelukt
          </h1>

          <p className="text-sm text-muted-foreground">
            Bedankt voor je aankoop. Je <strong className="text-foreground">{planInfo.name}</strong>
            {' '}({planInfo.price}{planInfo.period === 'eenmalig' ? '' : planInfo.period}
            {planInfo.period === 'eenmalig' ? ', eenmalig' : ''}) is geactiveerd.
          </p>

          <div className="rounded-xl border border-border bg-background/60 p-4 text-left space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Check je e-mail
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We hebben je een welkomstmail gestuurd met een inloglink.
                  Klik daarop om direct in te loggen. De mail kan een paar
                  minuten onderweg zijn. Kijk ook even in je spam.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Al een account? Je kunt ook{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              direct inloggen
            </Link>
            {' '}met je bestaande gegevens.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Vragen? Mail{' '}
          <a
            href="mailto:support@dbakompas.nl"
            className="text-accent hover:underline"
          >
            support@dbakompas.nl
          </a>
        </p>
      </div>
    </main>
  )
}
