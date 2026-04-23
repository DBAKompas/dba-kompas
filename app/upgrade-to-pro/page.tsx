import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

/**
 * Server component - geen UI, directe server-side actie.
 *
 * Flow:
 * 1. Niet ingelogd            → redirect naar /login?next=/upgrade-to-pro
 * 2. Al actief abonnement     → redirect naar /dashboard (geen duplicate)
 * 3. One-time purchase aanwezig → checkout met €9,95 coupon (eerste maand €10,05)
 * 4. Geen one-time purchase   → reguliere maandelijkse checkout zonder coupon
 */
export default async function UpgradeToProPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/upgrade-to-pro')
  }

  // Voorkomen dat iemand dubbel een abonnement aanmaakt
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existingSub) {
    redirect('/dashboard')
  }

  // Check of gebruiker recht heeft op de one-time korting
  const { data: oneTimePurchase } = await supabaseAdmin
    .from('one_time_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'purchased')
    .maybeSingle()

  // Haal stripe_customer_id op uit profiel
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dba-kompas.vercel.app'

  const sessionParams: Record<string, unknown> = {
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID_MONTHLY, quantity: 1 }],
    success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { user_id: user.id },
  }

  // Gebruik bestaande Stripe-klant als die er is, anders e-mail doorgeven
  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id
  } else {
    sessionParams.customer_email = user.email
  }

  // Coupon toepassen als de gebruiker een one-time purchase heeft
  const couponId = process.env.STRIPE_COUPON_ONE_TIME_UPGRADE
  if (oneTimePurchase && couponId) {
    sessionParams.discounts = [{ coupon: couponId }]
  }

  const session = await stripe.checkout.sessions.create(
    sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
  )

  if (!session.url) {
    redirect('/dashboard')
  }

  redirect(session.url)
}
