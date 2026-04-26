import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { issueWelcomeToken } from '@/lib/auth/welcome-token-server'
import { sendPurchaseWelcomeEmail } from '@/modules/email/send'

export const dynamic = 'force-dynamic'

// ── Auth check ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') return null
  return user
}

// ── POST: stuur welkomstmail opnieuw ─────────────────────────────────────────
//
// Body: { userId: string, plan: 'one_time' | 'monthly' | 'yearly' }
//
// Genereert een nieuwe activate- en login-URL via een vers welcome-token
// en stuurt de welkomstmail via Postmark. Eerder uitgestuurde tokens
// worden automatisch ingetrokken door markWelcomeTokenUsed.

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { userId, plan } = body as { userId?: string; plan?: string }

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId verplicht' }, { status: 400 })
  }

  const safePlan = (plan === 'monthly' || plan === 'yearly') ? plan : 'one_time'

  // Haal e-mail op
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('user_id', userId)
    .single()

  if (profileErr || !profile?.email) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
  }

  const email = profile.email
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl').replace(/\/+$/, '')

  try {
    // Nieuw token uitschrijven (revoke van oude tokens zit in markWelcomeTokenUsed
    // maar geldt alleen bij gebruik — meerdere uitstaande tokens zijn toegestaan)
    const token = await issueWelcomeToken({ userId, email })
    const encoded = encodeURIComponent(token)

    const activateLink = `${appUrl}/auth/activate/${encoded}`
    const loginLink    = `${appUrl}/auth/welcome/${encoded}`

    await sendPurchaseWelcomeEmail(email, safePlan, { activateLink, loginLink })

    return NextResponse.json({
      ok: true,
      bericht: `Welkomstmail verstuurd naar ${email}`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/resend-welcome] fout:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
