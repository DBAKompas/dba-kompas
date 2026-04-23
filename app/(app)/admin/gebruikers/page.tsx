'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  GebruikerFilters,
  LEGE_FILTERS,
  type GebruikerFilterState,
} from '@/components/admin/GebruikerFilters'

type AbonnementStatus = 'actief' | 'loopt_af' | 'inactief' | 'n.v.t.'
type EenmaligStatus =
  | 'beschikbaar'
  | 'in_uitvoering'
  | 'vervuld'
  | 'vervallen'
  | 'n.v.t.'
type QuotaPlan = 'free' | 'monthly' | 'yearly' | 'one_time'

type Gebruiker = {
  id: string
  user_id: string
  email: string | null
  role: string | null
  plan: QuotaPlan
  created_at: string
  last_sign_in_at: string | null
  aantal_analyses: number
  last_analyse_at: string | null
  last_news_read_at: string | null
  subscription: {
    status: string | null
    plan: string | null
    cancel_at_period_end: boolean | null
    current_period_end: string | null
    payment_failed: boolean | null
  } | null
  one_time: {
    status: string | null
    credit_used: boolean | null
    credit_used_at: string | null
    finalized_at: string | null
  } | null
  abonnement_status: AbonnementStatus
  eenmalig_status: EenmaligStatus
}

const PLAN_LABELS: Record<QuotaPlan, string> = {
  free: 'Gratis',
  one_time: 'Eenmalig',
  monthly: 'Maand',
  yearly: 'Jaar',
}

const ABO_BADGE: Record<AbonnementStatus, { label: string; cls: string }> = {
  actief: {
    label: 'Actief',
    cls: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  loopt_af: {
    label: 'Loopt af',
    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  inactief: {
    label: 'Inactief',
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  'n.v.t.': {
    label: '-',
    cls: 'text-muted-foreground',
  },
}

const EENMALIG_BADGE: Record<EenmaligStatus, { label: string; cls: string }> = {
  beschikbaar: {
    label: 'Beschikbaar',
    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  in_uitvoering: {
    label: 'In uitvoering',
    cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  vervuld: {
    label: 'Vervuld',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  vervallen: {
    label: 'Vervallen',
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  'n.v.t.': {
    label: '-',
    cls: 'text-muted-foreground',
  },
}

function planLabel(plan: QuotaPlan): string {
  return PLAN_LABELS[plan] ?? plan
}

function formatDatum(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Converteer 'YYYY-MM-DD' naar timestamp in lokale tijd aan het begin van
// de dag; voor 'tot' nemen we einde-van-dag zodat de datum inclusief is.
function datumFilterMatch(iso: string | null, van: string, tot: string): boolean {
  if (!van && !tot) return true
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (van) {
    const vanT = new Date(`${van}T00:00:00`).getTime()
    if (t < vanT) return false
  }
  if (tot) {
    const totT = new Date(`${tot}T23:59:59.999`).getTime()
    if (t > totT) return false
  }
  return true
}

function filterGebruikers(
  gebruikers: Gebruiker[],
  f: GebruikerFilterState
): Gebruiker[] {
  const zoekLower = f.zoek.trim().toLowerCase()
  const minAnalyses = f.minAnalyses.trim() === '' ? null : Number(f.minAnalyses)

  return gebruikers.filter((g) => {
    if (zoekLower && !(g.email ?? '').toLowerCase().includes(zoekLower))
      return false
    if (f.plan !== 'alle' && g.plan !== f.plan) return false
    if (f.rol !== 'alle') {
      const rol = g.role === 'admin' ? 'admin' : 'user'
      if (rol !== f.rol) return false
    }
    if (
      f.abonnementStatus !== 'alle' &&
      g.abonnement_status !== f.abonnementStatus
    )
      return false
    if (
      f.eenmaligStatus !== 'alle' &&
      g.eenmalig_status !== f.eenmaligStatus
    )
      return false
    if (minAnalyses !== null && !Number.isNaN(minAnalyses)) {
      if (g.aantal_analyses < minAnalyses) return false
    }
    if (!datumFilterMatch(g.created_at, f.aangemaaktVan, f.aangemaaktTot))
      return false
    if (
      !datumFilterMatch(
        g.last_sign_in_at,
        f.laatstIngelogdVan,
        f.laatstIngelogdTot
      )
    )
      return false
    if (
      !datumFilterMatch(
        g.last_analyse_at,
        f.laatsteAnalyseVan,
        f.laatsteAnalyseTot
      )
    )
      return false
    if (
      !datumFilterMatch(
        g.last_news_read_at,
        f.laatsteNieuwsVan,
        f.laatsteNieuwsTot
      )
    )
      return false
    return true
  })
}

export default function GebruikersPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [gebruikers, setGebruikers] = useState<Gebruiker[]>([])
  const [fetching, setFetching] = useState(true)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [filters, setFilters] = useState<GebruikerFilterState>(LEGE_FILTERS)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  const laadGebruikers = useCallback(async () => {
    setFetching(true)
    setFout(null)
    try {
      const res = await fetch('/api/admin/gebruikers')
      if (!res.ok) throw new Error('Ophalen mislukt')
      const data = await res.json()
      setGebruikers(data.gebruikers ?? [])
    } catch {
      setFout('Kon gebruikers niet ophalen. Probeer het opnieuw.')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && isAdmin) laadGebruikers()
  }, [loading, isAdmin, laadGebruikers])

  async function stuurResetMail(email: string | null) {
    if (!email) return
    setBezig(email)
    setMelding(null)
    try {
      const res = await fetch('/api/admin/gebruikers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, actie: 'reset_password' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Onbekende fout')
      setMelding(data.bericht)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Onbekende fout'
      setMelding(`Fout: ${msg}`)
    } finally {
      setBezig(null)
    }
  }

  const gefilterd = useMemo(
    () => filterGebruikers(gebruikers, filters),
    [gebruikers, filters]
  )

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fetching ? 'Laden...' : `${gebruikers.length} geregistreerd`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={laadGebruikers}
          disabled={fetching}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${fetching ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      {melding && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
          {melding}
        </div>
      )}

      {fout && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fout}
        </div>
      )}

      <GebruikerFilters
        value={filters}
        onChange={setFilters}
        totaal={gebruikers.length}
        zichtbaar={gefilterd.length}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Overzicht</h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {gebruikers.length === 0
              ? 'Geen gebruikers gevonden.'
              : 'Geen gebruikers matchen deze filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <Th>E-mail</Th>
                  <Th>Plan</Th>
                  <Th>Abonnement</Th>
                  <Th>Eenmalig</Th>
                  <Th>Rol</Th>
                  <Th className="text-right">Analyses</Th>
                  <Th>Laatste analyse</Th>
                  <Th>Laatst ingelogd</Th>
                  <Th>Nieuws gelezen</Th>
                  <Th>Aangemeld</Th>
                  <Th className="text-right">Acties</Th>
                </tr>
              </thead>
              <tbody>
                {gefilterd.map((g) => {
                  const abo = ABO_BADGE[g.abonnement_status]
                  const ot = EENMALIG_BADGE[g.eenmalig_status]
                  return (
                    <tr
                      key={g.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-foreground align-top">
                        {g.email ?? '-'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground align-top">
                        {planLabel(g.plan)}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <Badge className={abo.cls}>{abo.label}</Badge>
                        {g.abonnement_status === 'loopt_af' &&
                          g.subscription?.current_period_end && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              tot {formatDatum(g.subscription.current_period_end)}
                            </div>
                          )}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <Badge className={ot.cls}>{ot.label}</Badge>
                      </td>
                      <td className="px-5 py-3 align-top">
                        {g.role === 'admin' ? (
                          <Badge className="bg-primary/10 text-primary">
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Gebruiker</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums align-top">
                        {g.aantal_analyses}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground align-top">
                        {formatDatum(g.last_analyse_at)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground align-top">
                        {formatDatum(g.last_sign_in_at)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground align-top">
                        {formatDatum(g.last_news_read_at)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground align-top">
                        {formatDatum(g.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => stuurResetMail(g.email)}
                          disabled={bezig === g.email}
                          className="text-xs"
                        >
                          {bezig === g.email ? (
                            <>
                              <Loader2 className="size-3 animate-spin mr-1" />
                              Bezig...
                            </>
                          ) : (
                            'Wachtwoord reset'
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={`text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? ''}`}
    >
      {children}
    </span>
  )
}
