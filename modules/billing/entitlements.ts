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

  if (
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    (subscription.plan === 'monthly' || subscription.plan === 'yearly')
  ) {
    return subscription.plan
  }

  const { data: oneTimePurchase } = await supabase
    .from('one_time_purchases')
    .select('id')
    .eq('user_id', uid)
    .eq('status', 'purchased')
    .maybeSingle()

  if (oneTimePurchase) return 'one_time'

  return 'free'
}

export async function requirePlan(plan: Plan): Promise<boolean> {
  const userPlan = await getUserPlan()
  const hierarchy: Plan[] = ['free', 'pro', 'enterprise']
  return hierarchy.indexOf(userPlan) >= hierarchy.indexOf(plan)
}
