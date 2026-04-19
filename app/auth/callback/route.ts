import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { trackReferral } from '@/lib/referral/engine'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // ── Referral tracking na registratie (GROWTH-003) ──────────────────────
      // Als er een dba_ref cookie is, koppel die aan de nieuwe gebruiker
      if (data.user && type !== 'recovery') {
        const cookieStore = await cookies()
        const refCode = cookieStore.get('dba_ref')?.value
        if (refCode) {
          await trackReferral({
            referredUserId: data.user.id,
            referralCode: refCode,
          }).catch((err) => console.error('[auth/callback] trackReferral fout:', err))
        }
      }

      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
