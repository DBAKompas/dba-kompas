import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes die altijd toegankelijk zijn zonder inloggen
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/auth/',
  '/api/billing/webhook',
  '/',
  '/algemene-voorwaarden',
  '/privacy-en-cookiebeleid',
  '/ai-data-use-notice',
  '/api/quick-scan',
  '/api/loops/',
]

const REFERRAL_COOKIE = 'dba_ref'
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dagen

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Referral cookie opslaan (?ref=CODE in URL) ──────────────────────────
  // Dit doen we altijd - ook voor niet-ingelogde bezoekers
  const refCode = request.nextUrl.searchParams.get('ref')

  // Publieke routes altijd doorlaten
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next({ request })
    if (refCode && /^[A-Z0-9]{6,12}$/i.test(refCode) && !request.cookies.get(REFERRAL_COOKIE)) {
      response.cookies.set(REFERRAL_COOKIE, refCode.toUpperCase(), {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    return response
  }

  // Overige API routes doen hun eigen auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Niet-ingelogde gebruikers naar /login sturen met ?next= voor redirect na inloggen
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Referral cookie ook instellen op beveiligde routes (ingelogde gebruiker)
  if (refCode && /^[A-Z0-9]{6,12}$/i.test(refCode) && !request.cookies.get(REFERRAL_COOKIE)) {
    supabaseResponse.cookies.set(REFERRAL_COOKIE, refCode.toUpperCase(), {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  // Ingelogde gebruikers die /login bezoeken naar /dashboard sturen
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
