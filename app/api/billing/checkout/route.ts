import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { captureServerEvent } from '@/lib/posthog'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, plan, mode } = await request.json()

    // Resolve priceId from plan name if not provided directly
    let effectivePriceId = priceId
    if (!effectivePriceId && plan) {
      if (plan === 'monthly') effectivePriceId = process.env.STRIPE_PRICE_ID_MONTHLY
      else if (plan === 'yearly') effectivePriceId = process.env.STRIPE_PRICE_ID_YEARLY
    }

    if (!effectivePriceId) {
      return NextResponse.json({ error: 'priceId or plan is required' }, { status: 400 })
    }

    // Support both subscription and one-time payment modes
    const checkoutMode = mode === 'payment' ? 'payment' : 'subscription'

    const sessionParams: Record<string, unknown> = {
      mode: checkoutMode,
      // payment_method_types bewust weggelaten: Stripe beheert dit automatisch op basis van mode.
      // iDEAL werkt niet voor subscription mode en mag hier niet worden meegegeven.
      line_items: [{ price: effectivePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: { user_id: user.id },
    }

    // Look up existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    // PostHog: checkout gestart
    captureServerEvent({
      event: 'checkout_started',
      distinct_id: user.id,
      properties: {
        user_id: user.id,
        account_id: user.id,
        checkout_type: checkoutMode,
        plan_id: effectivePriceId,
        billing_interval: plan ?? null,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
