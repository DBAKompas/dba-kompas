import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Haal abonnementsstatus op
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Haal eenmalige aankoop op als geen abonnement gevonden
    let subscriptionInfo = null

    if (subscription) {
      const planLabel = subscription.plan === 'yearly' ? 'Jaarabonnement' : 'Maandabonnement'
      subscriptionInfo = { plan: planLabel, status: 'Actief' }
    } else {
      const { data: oneTime } = await supabase
        .from('one_time_purchases')
        .select('status, product_type')
        .eq('user_id', user.id)
        .eq('status', 'purchased')
        .limit(1)
        .maybeSingle()

      if (oneTime) {
        subscriptionInfo = { plan: 'Eenmalige check', status: 'Actief' }
      }
    }

    return NextResponse.json({ ...profile, subscription: subscriptionInfo })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields = [
      'name',
      'email',
      'bedrijfstak',
      'specialisatie',
      'nieuws_voorkeuren',
      'notificatie_instellingen',
      'taal_voorkeur',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
