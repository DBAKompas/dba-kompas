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
  Settings2,
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

const PAYWALL_EXEMPT = ['/profiel', '/admin']

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, plan, planLoading, roleLoading, isAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname)
      router.push(`/login?next=${next}`)
    }
  }, [loading, user, router, pathname])

  useEffect(() => {
    if (!loading && !planLoading && !roleLoading && user && plan === 'free' && !isAdmin) {
      const exempt = PAYWALL_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!exempt) router.push('/upgrade')
    }
  }, [loading, planLoading, roleLoading, user, plan, isAdmin, pathname, router])

  if (loading || planLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary/30" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary/30" />
      </div>
    )
  }

  if (plan === 'free' && !isAdmin) {
    const exempt = PAYWALL_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (!exempt) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-primary/30" />
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

      {/* ── Sidebar ───────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-card border-r border-border/50">

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-5 border-b border-border/40">
          <Link href="/dashboard">
            <BrandLogo variant="dark" className="h-7 w-auto" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="mx-2 my-3 border-t border-border/40" />
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Settings2 className="size-4 shrink-0" />
                Control Tower
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/40 px-3 py-3 space-y-0.5">
          <a
            href="https://dbakompas.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            Terug naar website
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            Uitloggen
          </button>
          {user.email && (
            <p className="px-3 pt-1 pb-0.5 text-[11px] text-muted-foreground/40 truncate">{user.email}</p>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────── */}
      <main className="ml-56 flex-1 min-h-screen">
        <div className="px-8 py-8 max-w-5xl">
          {children}
        </div>
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
