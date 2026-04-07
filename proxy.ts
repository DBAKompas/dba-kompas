import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes die altijd toegankelijk zijn zonder inloggen
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/billing/webhook',
  '/',
  '/algemene-voorwaarden',
  '/privacy-en-cookiebeleid',
  '/ai-data-use-notice',
  '/api/quick-scan',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Publieke routes altijd doorlaten
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next({ request })
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

  // Niet-ingelogde gebruikers naar /login sturen
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Ingelogde gebruikers die /login bezoeken naar /dashboard sturen
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
