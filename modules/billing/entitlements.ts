import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'pro' | 'enterprise'

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

export async function requirePlan(plan: Plan): Promise<boolean> {
  const userPlan = await getUserPlan()
  const hierarchy: Plan[] = ['free', 'pro', 'enterprise']
  return hierarchy.indexOf(userPlan) >= hierarchy.indexOf(plan)
}
