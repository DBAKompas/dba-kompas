import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { captureServerEvent } from '@/lib/posthog'
import { getActiveUpgradeOffer } from '@/lib/referral/upgrade'
import { UPGRADE_FIRST_MONTH_COUPON } from '@/lib/referral/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/billing/upgrade/checkout
 *
 * Maakt een Stripe checkout session voor de upgrade van eenmalig naar maand-abo,
 * met fixed coupon (UPGRADE_FIRST_MONTH_995) zodat de eerste maand 9,95 euro is.
 *
 * Vereist:
 *   - ingelogde gebruiker
 *   - actieve upgrade_offers-row (niet geaccepteerd, niet verlopen)
 *
 * Response 200: { url }
 * Response 401: niet ingelogd
 * Response 403: geen actieve upgrade-offer (geen rij of al geaccepteerd of verlopen)
 * Response 500: Stripe-fout, ontbrekende env, of onverwachte fout
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const offer = await getActiveUpgradeOffer(user.id)
    if (!offer) {
      return NextResponse.json({ error: 'no_active_upgrade_offer' }, { status: 403 })
    }

    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY
    if (!monthlyPriceId) {
      console.error('[billing/upgrade/checkout] STRIPE_PRICE_ID_MONTHLY ontbreekt')
      return NextResponse.json({ error: 'monthly_price_not_configured' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const couponCode = offer.couponCode ?? UPGRADE_FIRST_MONTH_COUPON

    const sessionParams: Record<string, unknown> = {
      mode: 'subscription',
      line_items: [{ price: monthlyPriceId, quantity: 1 }],
      discounts: [{ coupon: couponCode }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        upgrade_offer: 'true',
        coupon_code: couponCode,
      },
    }

    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    captureServerEvent({
      event: 'upgrade_checkout_started',
      distinct_id: user.id,
      properties: {
        user_id: user.id,
        account_id: user.id,
        coupon_code: couponCode,
        offer_expires_at: offer.expiresAt,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/upgrade/checkout] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
