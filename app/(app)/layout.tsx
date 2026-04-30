'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileSearch,
  Newspaper,
  BookOpen,
  Bell,
  User,
  LogOut,
  Loader2,
  ExternalLink,
  Settings2,
  Gift,
  Menu,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/marketing/BrandLogo'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',                    icon: LayoutDashboard },
  { href: '/analyse',      label: 'Analyse',                      icon: FileSearch },
  { href: '/nieuws',       label: 'Nieuws',                       icon: Newspaper },
  { href: '/gidsen',       label: 'Gidsen',                       icon: BookOpen },
  { href: '/beloningen',   label: 'Gratis toegang en beloningen', icon: Gift },
  { href: '/notificaties', label: 'Notificaties',                 icon: Bell },
  { href: '/profiel',      label: 'Profiel',                      icon: User },
]

const PAYWALL_EXEMPT = ['/profiel', '/admin']

// ── Navigatie-inhoud (gedeeld tussen sidebar en drawer) ───────────────────────

function NavContent({
  pathname,
  isAdmin,
  onNavClick,
  handleLogout,
  userEmail,
}: {
  pathname: string
  isAdmin: boolean
  onNavClick?: () => void
  handleLogout: () => void
  userEmail?: string
}) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
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
              onClick={onNavClick}
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
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          Uitloggen
        </button>
        {userEmail && (
          <p className="px-3 pt-1 pb-0.5 text-[11px] text-muted-foreground/40 truncate">{userEmail}</p>
        )}
      </div>
    </>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, plan, planLoading, roleLoading, isAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sluit drawer bij navigatie
  useEffect(() => { setDrawerOpen(false) }, [pathname])

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

      {/* ── Desktop sidebar (verborgen op mobiel) ─────────────── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-56 md:flex-col bg-card border-r border-border/50">
        <div className="flex h-16 shrink-0 items-center px-5 border-b border-border/40">
          <Link href="/dashboard">
            <BrandLogo variant="dark" className="h-7 w-auto" />
          </Link>
        </div>
        <NavContent
          pathname={pathname}
          isAdmin={isAdmin}
          handleLogout={handleLogout}
          userEmail={user.email}
        />
      </aside>

      {/* ── Mobiele topbar (alleen zichtbaar op mobiel) ────────── */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-card px-4 md:hidden">
        <Link href="/dashboard">
          <BrandLogo variant="dark" className="h-6 w-auto" />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Menu openen"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* ── Mobiele drawer overlay ─────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-border/40">
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)}>
                <BrandLogo variant="dark" className="h-6 w-auto" />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Menu sluiten"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavContent
              pathname={pathname}
              isAdmin={isAdmin}
              onNavClick={() => setDrawerOpen(false)}
              handleLogout={handleLogout}
              userEmail={user.email}
            />
          </aside>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-56">
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
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
