'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileSearch,
  Newspaper,
  FolderOpen,
  BookOpen,
  Bell,
  User,
  LogOut,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/marketing/BrandLogo'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/analyse',      label: 'Analyse',       icon: FileSearch },
  { href: '/nieuws',       label: 'Nieuws',        icon: Newspaper },
  { href: '/documenten',   label: 'Documenten',    icon: FolderOpen },
  { href: '/gidsen',       label: 'Gidsen',        icon: BookOpen },
  { href: '/notificaties', label: 'Notificaties',  icon: Bell },
  { href: '/profiel',      label: 'Profiel',       icon: User },
]

// Routes die altijd toegankelijk zijn, ook zonder betaald plan
const PAYWALL_EXEMPT = ['/profiel']

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, plan, planLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect naar login als niet ingelogd, met ?next= voor redirect na inloggen
  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname)
      router.push(`/login?next=${next}`)
    }
  }, [loading, user, router, pathname])

  // Paywall: redirect naar /upgrade als ingelogd maar geen betaald plan
  useEffect(() => {
    if (!loading && !planLoading && user && plan === 'free') {
      const exempt = PAYWALL_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!exempt) {
        router.push('/upgrade')
      }
    }
  }, [loading, planLoading, user, plan, pathname, router])

  // Toon spinner zolang auth of plan nog laden
  if (loading || planLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-7 animate-spin text-primary/40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-7 animate-spin text-primary/40" />
      </div>
    )
  }

  // Toon spinner als plan 'free' is en we gaan redirecten (niet op vrijgestelde routes)
  if (plan === 'free') {
    const exempt = PAYWALL_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (!exempt) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="size-7 animate-spin text-primary/40" />
        </div>
      )
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border/50 bg-card">

        {/* Logo */}
        <div className="flex h-14 items-center px-4 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center">
            <BrandLogo variant="dark" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 p-3 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="size-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/40 p-3 space-y-1">
          <a
            href="https://dbakompas.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ExternalLink className="size-3.5 flex-shrink-0" />
            Terug naar website
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="size-4 flex-shrink-0" />
            Uitloggen
          </button>
          {user.email && (
            <p className="px-3 pt-1 text-[11px] text-muted-foreground/40 truncate">{user.email}</p>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────── */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
