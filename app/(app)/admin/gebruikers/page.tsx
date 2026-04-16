'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

type Gebruiker = {
  id: string
  email: string
  plan: string | null
  role: string | null
  created_at: string
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  one_time: 'Eenmalig',
  monthly: 'Maand',
  yearly: 'Jaar',
}

function planLabel(plan: string | null): string {
  if (!plan) return 'Onbekend'
  return PLAN_LABELS[plan] ?? plan
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && user && !isAdmin) {
      router.push('/dashboard')
    }
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
    if (!loading && isAdmin) {
      laadGebruikers()
    }
  }, [loading, isAdmin, laadGebruikers])

  async function stuurResetMail(email: string) {
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

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gebruikers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
        <div className="mb-6 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-sm text-foreground">
          {melding}
        </div>
      )}

      {fout && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fout}
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overzicht</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : gebruikers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Geen gebruikers gevonden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Abonnement</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Rol</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Aangemeld op</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {gebruikers.map((g) => (
                    <tr key={g.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{g.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{planLabel(g.plan)}</td>
                      <td className="px-6 py-4">
                        {g.role === 'admin' ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            Admin
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Gebruiker</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDatum(g.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => stuurResetMail(g.email)}
                          disabled={bezig === g.email}
                          className="text-xs"
                        >
                          {bezig === g.email ? (
                            <><Loader2 className="size-3 animate-spin mr-1" />Bezig...</>
                          ) : (
                            'Wachtwoord reset'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
