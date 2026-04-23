import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro' | 'enterprise'

/**
 * Granulaire plan-classificatie voor quota en UI-beslissingen.
 * 'free'     = geen actieve betaling
 * 'monthly'  = maandabonnement actief / trialing
 * 'yearly'   = jaarabonnement actief / trialing
 * 'one_time' = alleen eenmalige check gekocht (geen sub)
 */
export type QuotaPlan = 'free' | 'monthly' | 'yearly' | 'one_time'

/**
 * Pure resolver — bepaalt het effectieve plan op basis van subscription-state
 * en eenmalige aankoop. Subscription (active/trialing met monthly/yearly) wint
 * altijd van one_time. Gebruikt door zowel single-user als batch-helpers
 * zodat er één bron van waarheid is voor plan-resolutie.
 */
export function resolveQuotaPlan(input: {
  subscription: { status: string | null; plan: string | null } | null
  hasOneTimePurchase: boolean
}): QuotaPlan {
  const { subscription, hasOneTimePurchase } = input
  if (
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    (subscription.plan === 'monthly' || subscription.plan === 'yearly')
  ) {
    return subscription.plan
  }
  if (hasOneTimePurchase) return 'one_time'
  return 'free'
}

export async function getUserPlan(): Promise<Plan> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'free'

  // Check actief abonnement (maandelijks of jaarlijks)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', user.id)
    .single()

  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    return 'pro'
  }

  // Check eenmalige aankoop
  const { data: oneTimePurchase } = await supabase
    .from('one_time_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'purchased')
    .maybeSingle()

  if (oneTimePurchase) return 'pro'

  return 'free'
}

/**
 * Bepaalt het specifieke betaalplan voor quota- en UI-doeleinden.
 * Abonnement wint van eenmalige aankoop als beide bestaan.
 */
export async function getUserQuotaPlan(userId?: string): Promise<QuotaPlan> {
  const supabase = await createClient()

  let uid = userId
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'
    uid = user.id
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', uid)
    .maybeSingle()

  const { data: oneTimePurchase } = await supabase
    .from('one_time_purchases')
    .select('id')
    .eq('user_id', uid)
    .eq('status', 'purchased')
    .maybeSingle()

  return resolveQuotaPlan({
    subscription: subscription
      ? { status: subscription.status ?? null, plan: subscription.plan ?? null }
      : null,
    hasOneTimePurchase: Boolean(oneTimePurchase),
  })
}

/**
 * Batch-variant van plan-resolutie voor admin-lijsten of andere bulk-flows.
 * Doet twee queries (subscriptions + one_time_purchases) ongeacht het aantal
 * users, en past per user dezelfde resolver toe. Client wordt als parameter
 * ontvangen zodat de caller expliciet kiest tussen user-scoped (RLS) of
 * service-role (admin).
 *
 * Retourneert een Map die voor elk van de gevraagde userIds een plan bevat;
 * users zonder subscription of one_time_purchase krijgen 'free'.
 */
export async function getQuotaPlansForUsers(
  client: SupabaseClient,
  userIds: string[]
): Promise<Map<string, QuotaPlan>> {
  const result = new Map<string, QuotaPlan>()
  if (userIds.length === 0) return result

  const [subsResponse, oneTimeResponse] = await Promise.all([
    client
      .from('subscriptions')
      .select('user_id, status, plan')
      .in('user_id', userIds)
      .in('status', ['active', 'trialing']),
    client
      .from('one_time_purchases')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'purchased'),
  ])

  if (subsResponse.error) throw new Error(subsResponse.error.message)
  if (oneTimeResponse.error) throw new Error(oneTimeResponse.error.message)

  const subsByUser = new Map<string, { status: string | null; plan: string | null }>()
  for (const row of subsResponse.data ?? []) {
    subsByUser.set(row.user_id, {
      status: row.status ?? null,
      plan: row.plan ?? null,
    })
  }

  const oneTimeUserIds = new Set<string>()
  for (const row of oneTimeResponse.data ?? []) {
    oneTimeUserIds.add(row.user_id)
  }

  for (const uid of userIds) {
    result.set(
      uid,
      resolveQuotaPlan({
        subscription: subsByUser.get(uid) ?? null,
        hasOneTimePurchase: oneTimeUserIds.has(uid),
      })
    )
  }

  return result
}

export async function requirePlan(plan: Plan): Promise<boolean> {
  const userPlan = await getUserPlan()
  const hierarchy: Plan[] = ['free', 'pro', 'enterprise']
  return hierarchy.indexOf(userPlan) >= hierarchy.indexOf(plan)
}
