/**
 * /api/one-time/checkout-guest — publieke one-time checkout (KI-020).
 *
 * Accepteert alleen een e-mailadres en start direct een Stripe Checkout Session
 * in `mode: 'payment'` voor de one-time DBA analyse (`STRIPE_PRICE_ID_ONE_TIME`).
 * De Stripe webhook provisioneert de Supabase user NA betaling via
 * `lib/auth/provision-user.ts`, zodat er geen user zonder bewijs-van-betaling
 * wordt aangemaakt via dit publieke endpoint.
 *
 * Zie ook: app/api/billing/checkout-guest/route.ts voor subscriptions,
 *          app/api/billing/webhook/route.ts voor post-payment provisioning,
 *          lib/auth/provision-user.ts voor user-creatie + magic link.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { captureServerEvent } from '@/lib/posthog'
import { normalizeEmail } from '@/lib/auth/provision-user'

type GuestOneTimeBody = {
  email?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GuestOneTimeBody
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
    }

    const priceId = process.env.STRIPE_PRICE_ID_ONE_TIME
    if (!priceId) {
      console.error('[one-time/checkout-guest] STRIPE_PRICE_ID_ONE_TIME ontbreekt')
      return NextResponse.json(
        { error: 'One-time purchase niet geconfigureerd' },
        { status: 500 },
      )
    }

    // Referral-cookie doorzetten (GROWTH-001) zodat de webhook de referral kan koppelen
    const cookieStore = await cookies()
    const referralCode = cookieStore.get('dba_ref')?.value ?? null

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}/dashboard?one_time=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/`,
      metadata: {
        guest_email: email,
        guest_flow: 'true',
        product_type: 'one_time_dba',
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    })

    captureServerEvent({
      event: 'checkout_started',
      distinct_id: email,
      properties: {
        checkout_type: 'one_time',
        plan_id: priceId,
        product_type: 'one_time_dba',
        guest_flow: true,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[one-time/checkout-guest] onverwachte fout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
