'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  CalendarPlus,
  Link2,
  X,
} from 'lucide-react'

type LinkStatus = 'unused' | 'used' | 'expired'

interface WelcomeLinkItem {
  token: string
  referralCode: string
  campaignLabel: string | null
  status: LinkStatus
  createdAt: string
  expiresAt: string | null
  usedAt: string | null
  creator: { userId: string; name: string | null; email: string | null } | null
  redeemer: { userId: string; name: string | null; email: string | null } | null
}

const STATUS_TABS: Array<{ value: 'all' | LinkStatus; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'unused', label: 'Niet gebruikt' },
  { value: 'used', label: 'Gebruikt' },
  { value: 'expired', label: 'Verlopen' },
]

const STATUS_BADGE: Record<LinkStatus, string> = {
  unused: 'bg-emerald-100 text-emerald-700',
  used: 'bg-blue-100 text-blue-700',
  expired: 'bg-amber-100 text-amber-700',
}

const STATUS_LABEL: Record<LinkStatus, string> = {
  unused: 'Niet gebruikt',
  used: 'Gebruikt',
  expired: 'Verlopen',
}

function formatDatum(iso: string | null) {
  if (!iso) return 'geen'
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shareUrl(token: string) {
  const base = (typeof window !== 'undefined' ? window.location.origin : 'https://dbakompas.nl').replace(/\/+$/, '')
  return `${base}/c/${token}`
}

export default function AdminWelcomeLinksPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<WelcomeLinkItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | LinkStatus>('all')
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [extending, setExtending] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    campaignLabel: 'LINKEDIN-GRATIS-CHECK',
    expiresAt: '',
  })

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  const loadList = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/admin/referral/welcome-link/list?status=${statusFilter}&limit=200`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setBanner({ kind: 'error', text: json?.error || 'Kon lijst niet laden' })
        setItems([])
        return
      }
      setItems(json.items as WelcomeLinkItem[])
    } catch (err) {
      console.error('[admin/welcome-links] load fout:', err)
      setBanner({ kind: 'error', text: 'Netwerkfout bij laden' })
    } finally {
      setFetching(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (!loading && isAdmin) loadList()
  }, [loading, isAdmin, loadList])

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setBanner(null)
    try {
      const expiresIso = createForm.expiresAt
        ? new Date(`${createForm.expiresAt}T23:59:59`).toISOString()
        : null
      const res = await fetch('/api/admin/referral/welcome-link/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignLabel: createForm.campaignLabel || 'LINKEDIN-GRATIS-CHECK',
          expiresAt: expiresIso,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setBanner({ kind: 'error', text: json?.error || 'Aanmaken mislukt' })
        return
      }
      setBanner({ kind: 'success', text: `Link aangemaakt voor code ${json.code}` })
      setShowCreate(false)
      setCreateForm({ campaignLabel: 'LINKEDIN-GRATIS-CHECK', expiresAt: '' })
      await loadList()
    } catch (err) {
      console.error('[admin/welcome-links] create fout:', err)
      setBanner({ kind: 'error', text: 'Netwerkfout bij aanmaken' })
    } finally {
      setCreating(false)
    }
  }, [createForm, loadList])

  const handleCopy = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token))
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      setBanner({ kind: 'error', text: 'Kopiëren naar klembord mislukt' })
    }
  }, [])

  const handleExtend = useCallback(async (token: string) => {
    setExtending(token)
    setBanner(null)
    try {
      const res = await fetch('/api/admin/referral/welcome-link/extend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, days: 7 }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setBanner({ kind: 'error', text: json?.error || 'Verlengen mislukt' })
        return
      }
      setBanner({ kind: 'success', text: `Verlengd tot ${formatDatum(json.expiresAt)}` })
      await loadList()
    } catch (err) {
      console.error('[admin/welcome-links] extend fout:', err)
      setBanner({ kind: 'error', text: 'Netwerkfout bij verlengen' })
    } finally {
      setExtending(null)
    }
  }, [loadList])

  const counts = useMemo(() => {
    const base = { all: items.length, unused: 0, used: 0, expired: 0 }
    for (const it of items) base[it.status] += 1
    return base
  }, [items])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" /> Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Link2 className="size-5 text-muted-foreground" />
              Welkomstlinks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Genereer en beheer deelbare welkomstlinks voor campagnes (LinkedIn, e-mail, etc.).
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-2" /> Nieuwe link
        </Button>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-lg border p-3 text-sm flex items-start justify-between gap-3 ${
            banner.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="text-current/70 hover:text-current">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === tab.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-border hover:bg-muted/50'
            }`}
          >
            {tab.label}
            {' '}
            <span className="opacity-70">({counts[tab.value]})</span>
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={loadList} disabled={fetching}>
          <RefreshCw className={`size-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Campagne</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aangemaakt</th>
                <th className="px-4 py-3 font-medium">Verloopt</th>
                <th className="px-4 py-3 font-medium">Gebruikt door</th>
                <th className="px-4 py-3 font-medium text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {fetching && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin inline-block mr-2" /> Laden...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Geen welkomstlinks gevonden voor dit filter.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.token} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{it.referralCode}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{it.campaignLabel ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[it.status]}`}>
                        {STATUS_LABEL[it.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDatum(it.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDatum(it.expiresAt)}</td>
                    <td className="px-4 py-3 text-xs">
                      {it.redeemer ? (
                        <span>{it.redeemer.name || it.redeemer.email || it.redeemer.userId.slice(0, 8)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(it.token)}
                          title="Kopieer share-URL"
                        >
                          {copiedToken === it.token ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        {it.status === 'unused' || it.status === 'expired' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExtend(it.token)}
                            disabled={extending === it.token}
                            title="Verleng met 7 dagen"
                          >
                            {extending === it.token ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CalendarPlus className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nieuwe welkomstlink</h2>
              <button
                onClick={() => !creating && setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Sluiten"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Campagne-label
                </label>
                <Input
                  value={createForm.campaignLabel}
                  onChange={(e) => setCreateForm((f) => ({ ...f, campaignLabel: e.target.value }))}
                  placeholder="LINKEDIN-GRATIS-CHECK"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Verloopt op (optioneel)
                </label>
                <Input
                  type="date"
                  value={createForm.expiresAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laat leeg voor een onbeperkt geldige link.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  Annuleer
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" /> Aanmaken...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" /> Aanmaken
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
