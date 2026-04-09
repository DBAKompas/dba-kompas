import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const priceId = process.env.STRIPE_PRICE_ID_ONE_TIME

    if (!priceId) {
      console.error('STRIPE_PRICE_ID_ONE_TIME not configured')
      return NextResponse.json({ error: 'One-time purchase not configured' }, { status: 500 })
    }

    // Look up existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const sessionParams: Record<string, unknown> = {
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?one_time=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        user_id: user.id,
        product_type: 'one_time_dba',
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

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('One-time checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
