import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const REFERRAL_COOKIE = 'dba_ref'
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dagen

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ── 1. Referral cookie opslaan (?ref=CODE in URL) ──────────────────────────
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && /^[A-Z0-9]{6,12}$/i.test(refCode)) {
    // Alleen opslaan als er nog geen cookie is (eerste referrer wint)
    if (!request.cookies.get(REFERRAL_COOKIE)) {
      response.cookies.set(REFERRAL_COOKIE, refCode.toUpperCase(), {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
  }

  // ── 2. Supabase sessie vernieuwen (vereist door @supabase/ssr) ─────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Sessie ophalen zodat auth-cookies up-to-date blijven
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Alle routes behalve static files en _next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
