/**
 * /api/billing/checkout-guest — publieke subscription-checkout (KI-020).
 *
 * Accepteert een e-mailadres + plan ('monthly' | 'yearly'), maakt een Stripe
 * Checkout Session aan met `customer_email` vooringevuld en `metadata.guest_email`.
 * De Stripe webhook provisioneert de Supabase user pas NA voltooide betaling,
 * zodat geen user zonder bewijs-van-betaling kan worden aangemaakt via dit endpoint.
 *
 * Zie ook: app/api/one-time/checkout-guest/route.ts voor eenmalige aankopen,
 *          app/api/billing/webhook/route.ts voor de post-payment provisioning,
 *          lib/auth/provision-user.ts voor user-creatie + magic link.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { captureServerEvent } from '@/lib/posthog'
import { normalizeEmail } from '@/lib/auth/provision-user'

type GuestCheckoutBody = {
  email?: string
  plan?: 'monthly' | 'yearly'
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GuestCheckoutBody
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const plan = body.plan

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
    }
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Ongeldig plan' }, { status: 400 })
    }

    const priceId =
      plan === 'monthly'
        ? process.env.STRIPE_PRICE_ID_MONTHLY
        : process.env.STRIPE_PRICE_ID_YEARLY

    if (!priceId) {
      console.error(`[checkout-guest] priceId ontbreekt voor plan=${plan}`)
      return NextResponse.json({ error: 'Plan niet geconfigureerd' }, { status: 500 })
    }

    // Referral-cookie doorzetten (GROWTH-001) zodat de webhook de referral kan koppelen
    const cookieStore = await cookies()
    const referralCode = cookieStore.get('dba_ref')?.value ?? null

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/`,
      metadata: {
        guest_email: email,
        guest_flow: 'true',
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    })

    captureServerEvent({
      event: 'checkout_started',
      distinct_id: email,
      properties: {
        checkout_type: 'subscription',
        plan_id: priceId,
        billing_interval: plan,
        guest_flow: true,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout-guest] onverwachte fout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
