import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendLoopsEvent, updateLoopsContact } from '@/lib/loops'
import { captureServerEvent } from '@/lib/posthog'
import { sendOneTimeUpsellEmail } from '@/modules/email/send'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existingEvent) {
    return NextResponse.json({ received: true, deduplicated: true })
  }

  // Record event for idempotency
  await supabaseAdmin
    .from('billing_events')
    .insert({ stripe_event_id: event.id, event_type: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ---------- Helpers ----------

async function getUserEmailById(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('user_id', userId)
    .single()
  return data?.email ?? null
}

function determinePlan(subscription: Stripe.Subscription): string {
  const interval = subscription.items.data[0]?.price?.recurring?.interval
  return interval === 'year' ? 'yearly' : 'monthly'
}

// ---------- Event Handlers ----------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) return

  const customerId = session.customer as string

  // Handle one-time purchase
  if (session.mode === 'payment') {
    const productType = session.metadata?.product_type || 'one_time_dba'

    await supabaseAdmin
      .from('one_time_purchases')
      .insert({
        user_id: userId,
        product_type: productType,
        status: 'purchased',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: customerId,
      })

    // Update profile stripe_customer_id if not set
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', userId)
      .is('stripe_customer_id', null)

    const email = await getUserEmailById(userId)
    if (email) {
      await Promise.all([
        sendLoopsEvent('one_time_purchase', {
          email,
          userId,
          properties: { product_type: productType },
          dedupKey: session.id,
        }),
        updateLoopsContact(email, {
          plan: 'one_time',
          subscription_status: 'active',
        }, `one-time-${userId}`),
        // Upsell e-mail: korting eerste maand bij upgrade naar maandabonnement
        sendOneTimeUpsellEmail(email).catch(err =>
          console.error('Upsell e-mail kon niet worden verstuurd:', err)
        ),
      ])
    }
    return
  }

  // Handle subscription checkout
  const subscriptionId = session.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = determinePlan(subscription)
  const periodEnd = subscription.items.data[0]?.current_period_end

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    }, { onConflict: 'stripe_subscription_id' })

  // Update profile
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
      stripe_customer_id: customerId,
    })
    .eq('user_id', userId)

  const email = await getUserEmailById(userId)
  if (email) {
    await Promise.all([
      sendLoopsEvent('subscription_started', {
        email,
        userId,
        properties: { plan, status: subscription.status },
        dedupKey: session.id,
      }),
      updateLoopsContact(email, {
        subscription_status: 'active',
        plan: plan as 'monthly' | 'yearly',
      }, `sub-start-${userId}`),
    ])
  }

  // PostHog: abonnement gestart
  captureServerEvent({
    event: 'subscription_started',
    distinct_id: userId,
    properties: {
      user_id: userId,
      account_id: userId,
      subscription_id: subscriptionId,
      plan_id: plan,
      billing_interval: plan,
      origin_checkout_type: 'subscription',
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const plan = determinePlan(subscription)
  const periodEnd = subscription.items.data[0]?.current_period_end

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSub) return

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      plan,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      payment_failed: false,
    })
    .eq('stripe_subscription_id', subscription.id)

  // Sync profile subscription_status
  const profileStatus = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'active'
    : subscription.status === 'past_due'
      ? 'past_due'
      : subscription.status
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: profileStatus })
    .eq('user_id', existingSub.user_id)

  const email = await getUserEmailById(existingSub.user_id)
  if (email) {
    const loopsStatus =
      subscription.status === 'active' || subscription.status === 'trialing'
        ? 'active'
        : subscription.status === 'canceled'
          ? 'canceled'
          : 'inactive'
    await updateLoopsContact(email, {
      subscription_status: loopsStatus,
      plan: plan as 'monthly' | 'yearly',
    }, `sub-update-${subscription.id}-${subscription.status}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSub) return

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id)

  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('user_id', existingSub.user_id)

  const email = await getUserEmailById(existingSub.user_id)
  if (email) {
    await Promise.all([
      sendLoopsEvent('subscription_canceled', {
        email,
        userId: existingSub.user_id,
        dedupKey: `cancel-${subscription.id}`,
      }),
      updateLoopsContact(email, {
        subscription_status: 'canceled',
        plan: 'none',
      }, `sub-cancel-${existingSub.user_id}`),
    ])
  }

  // PostHog: abonnement opgezegd
  captureServerEvent({
    event: 'subscription_canceled',
    distinct_id: existingSub.user_id,
    properties: {
      user_id: existingSub.user_id,
      account_id: existingSub.user_id,
      subscription_id: subscription.id,
    },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null
  if (!subscriptionId) return

  // Reset payment_failed flag on successful payment
  await supabaseAdmin
    .from('subscriptions')
    .update({ payment_failed: false })
    .eq('stripe_subscription_id', subscriptionId)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null
  if (!subscriptionId) return

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!existingSub) return

  await supabaseAdmin
    .from('subscriptions')
    .update({ payment_failed: true })
    .eq('stripe_subscription_id', subscriptionId)

  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('user_id', existingSub.user_id)

  const email = await getUserEmailById(existingSub.user_id)
  if (email) {
    await sendLoopsEvent('payment_failed', {
      email,
      userId: existingSub.user_id,
      dedupKey: `pf-${invoice.id}`,
    })
  }

  // PostHog: betaling mislukt
  captureServerEvent({
    event: 'payment_failed',
    distinct_id: existingSub.user_id,
    properties: {
      user_id: existingSub.user_id,
      account_id: existingSub.user_id,
      subscription_id: subscriptionId,
    },
  })
}
