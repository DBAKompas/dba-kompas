import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Geen toegang' }, { status: 403 }) }

  return { userId: user.id }
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/gebruikers] query error:', error.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  return NextResponse.json({ gebruikers: profiles ?? [] })
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const body = await request.json()
  const { email, actie } = body as { email?: string; actie?: string }

  if (!email || !actie) {
    return NextResponse.json({ error: 'email en actie zijn verplicht' }, { status: 400 })
  }

  if (actie === 'reset_password') {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })
    if (error) {
      console.error('[admin/gebruikers] resetPasswordForEmail error:', error.message)
      return NextResponse.json({ error: 'Kan reset-mail niet sturen' }, { status: 500 })
    }
    return NextResponse.json({ success: true, bericht: `Wachtwoord-reset mail verstuurd naar ${email}` })
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
}
