import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth check - alleen admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Totalen ──────────────────────────────────────────────────────────────────

  const [
    { count: totalCodes },
    { count: totalPending },
    { count: totalQualified },
    { count: totalRewarded },
    { count: totalRewards },
  ] = await Promise.all([
    supabaseAdmin.from('referral_codes').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('referral_tracking').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('referral_tracking').select('id', { count: 'exact', head: true }).eq('status', 'qualified'),
    supabaseAdmin.from('referral_tracking').select('id', { count: 'exact', head: true }).eq('status', 'rewarded'),
    supabaseAdmin.from('referral_rewards').select('id', { count: 'exact', head: true }),
  ])

  const totalTracked = (totalPending ?? 0) + (totalQualified ?? 0) + (totalRewarded ?? 0)
  const totalConverted = (totalQualified ?? 0) + (totalRewarded ?? 0)
  const conversionRate = totalTracked > 0 ? Math.round((totalConverted / totalTracked) * 100) : 0

  // ── Top referrers (max 10) ────────────────────────────────────────────────

  const { data: topReferrersRaw } = await supabaseAdmin
    .from('referral_tracking')
    .select('referrer_id')
    .in('status', ['qualified', 'rewarded'])

  // Tel per referrer_id
  const countMap: Record<string, number> = {}
  for (const row of topReferrersRaw ?? []) {
    countMap[row.referrer_id] = (countMap[row.referrer_id] ?? 0) + 1
  }
  const sortedReferrers = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Haal emails + codes op voor de top referrers
  const topReferrerIds = sortedReferrers.map(([id]) => id)

  // Supabase .in() met een lege array gooit een fout — skip de queries als er geen referrers zijn
  let topProfiles: { id: string; email: string }[] = []
  let topCodes: { user_id: string; code: string }[] = []
  let topRewards: { referrer_id: string; milestone: number; reward_type: string }[] = []

  if (topReferrerIds.length > 0) {
    const [profilesRes, codesRes, rewardsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, email').in('id', topReferrerIds),
      supabaseAdmin.from('referral_codes').select('user_id, code').in('user_id', topReferrerIds),
      supabaseAdmin.from('referral_rewards').select('referrer_id, milestone, reward_type').in('referrer_id', topReferrerIds),
    ])
    topProfiles = profilesRes.data ?? []
    topCodes    = codesRes.data ?? []
    topRewards  = rewardsRes.data ?? []
  }

  const profileMap = Object.fromEntries(topProfiles.map(p => [p.id, p.email]))
  const codeMap = Object.fromEntries(topCodes.map(c => [c.user_id, c.code]))
  const rewardsMap: Record<string, number[]> = {}
  for (const r of topRewards) {
    if (!rewardsMap[r.referrer_id]) rewardsMap[r.referrer_id] = []
    rewardsMap[r.referrer_id].push(r.milestone)
  }

  const topReferrers = sortedReferrers.map(([id, count]) => ({
    userId: id,
    email: profileMap[id] ?? '-',
    code: codeMap[id] ?? '-',
    qualifiedCount: count,
    milestones: rewardsMap[id] ?? [],
  }))

  // ── Recente activiteit (laatste 20 trackings) ─────────────────────────────

  const { data: recentRaw } = await supabaseAdmin
    .from('referral_tracking')
    .select('id, referred_user_id, referrer_id, referral_code, status, created_at, checkout_session_id')
    .order('created_at', { ascending: false })
    .limit(20)

  // Verzamel alle user IDs voor profiel lookup
  const activityUserIds = new Set<string>()
  for (const row of recentRaw ?? []) {
    activityUserIds.add(row.referred_user_id)
    activityUserIds.add(row.referrer_id)
  }

  const activityUserIdList = Array.from(activityUserIds)
  let activityProfiles: { id: string; email: string }[] = []
  if (activityUserIdList.length > 0) {
    const res = await supabaseAdmin.from('profiles').select('id, email').in('id', activityUserIdList)
    activityProfiles = res.data ?? []
  }

  const activityProfileMap = Object.fromEntries(activityProfiles.map(p => [p.id, p.email]))

  // Zoek aan wat er gekocht is per referred_user_id
  const referredIds = (recentRaw ?? []).map(r => r.referred_user_id)

  let otp: { user_id: string; product_type: string; status: string; created_at: string }[] = []
  let subs: { user_id: string; plan: string; status: string; created_at: string }[] = []
  if (referredIds.length > 0) {
    const [otpRes, subsRes] = await Promise.all([
      supabaseAdmin
        .from('one_time_purchases')
        .select('user_id, product_type, status, created_at')
        .in('user_id', referredIds)
        .not('product_type', 'eq', 'referral_free_check'),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan, status, created_at')
        .in('user_id', referredIds),
    ])
    otp  = otpRes.data ?? []
    subs = subsRes.data ?? []
  }

  // Bouw purchase lookup: user_id → beschrijving
  const purchaseMap: Record<string, string> = {}
  for (const p of otp) {
    if (p.status === 'granted') {
      purchaseMap[p.user_id] = `Losse analyse (${p.product_type})`
    }
  }
  for (const s of subs) {
    if (s.status === 'active') {
      purchaseMap[s.user_id] = `Abonnement ${s.plan}`
    }
  }

  const recentActivity = (recentRaw ?? []).map(row => ({
    id: row.id,
    referredEmail: activityProfileMap[row.referred_user_id] ?? '-',
    referrerEmail: activityProfileMap[row.referrer_id] ?? '-',
    referralCode: row.referral_code,
    status: row.status,
    purchase: purchaseMap[row.referred_user_id] ?? null,
    createdAt: row.created_at,
  }))

  // ── Weektrend (laatste 8 weken, qualified + rewarded) ────────────────────

  const { data: weekRaw } = await supabaseAdmin
    .from('referral_tracking')
    .select('created_at')
    .in('status', ['qualified', 'rewarded'])
    .gte('created_at', new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString())

  const weekBuckets: Record<string, number> = {}
  for (const row of weekRaw ?? []) {
    const d = new Date(row.created_at)
    // ISO week: maandag als start
    const dayOfWeek = (d.getDay() + 6) % 7 // 0=ma
    const monday = new Date(d)
    monday.setDate(d.getDate() - dayOfWeek)
    const key = monday.toISOString().slice(0, 10)
    weekBuckets[key] = (weekBuckets[key] ?? 0) + 1
  }

  // Vul 8 weken op (ook weken met 0)
  const weekTrend: Array<{ week: string; count: number }> = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    const dayOfWeek = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - dayOfWeek - i * 7)
    const key = monday.toISOString().slice(0, 10)
    weekTrend.push({ week: key, count: weekBuckets[key] ?? 0 })
  }

  return NextResponse.json({
    totals: {
      totalCodes: totalCodes ?? 0,
      totalTracked,
      totalConverted,
      conversionRate,
      totalRewards: totalRewards ?? 0,
    },
    topReferrers,
    recentActivity,
    weekTrend,
  })
}
