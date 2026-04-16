import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Controleer of de ingelogde gebruiker admin is via de profiles tabel. */
async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Geen toegang' }, { status: 403 }) }
  }

  return { userId: user.id }
}

export async function GET() {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id, email, plan, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('[admin/gebruikers] profiles query error:', profilesError.message)
    return NextResponse.json({ error: 'Database fout' }, { status: 500 })
  }

  return NextResponse.json({ gebruikers: profiles ?? [] })
}

/** Stuur een wachtwoord-reset mail voor een gebruiker. */
export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const body = await request.json()
  const { email, actie } = body as { email?: string; actie?: string }

  if (!email || !actie) {
    return NextResponse.json({ error: 'email en actie zijn verplicht' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (actie === 'reset_password') {
    const { error } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })

    if (error) {
      console.error('[admin/gebruikers] resetPasswordForEmail error:', error.message)
      return NextResponse.json({ error: 'Kan reset-mail niet sturen' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bericht: `Wachtwoord-reset mail verstuurd naar ${email}`,
    })
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
}
