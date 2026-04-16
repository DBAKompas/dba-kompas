'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

type GebruikerAnalyse = {
  user_id: string
  email: string
  plan: string | null
  totaal: number
  laag: number
  gemiddeld: number
  hoog: number
  laatste: string
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  one_time: 'Eenmalig',
  monthly: 'Maand',
  yearly: 'Jaar',
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AnalysesPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<GebruikerAnalyse[]>([])
  const [fetching, setFetching] = useState(true)
  const [fout, setFout] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  const laadData = useCallback(async () => {
    setFetching(true)
    setFout(null)
    try {
      const res = await fetch('/api/admin/analyses')
      if (!res.ok) throw new Error('Ophalen mislukt')
      const json = await res.json()
      setData(json.analyses ?? [])
    } catch {
      setFout('Kon analyses niet ophalen. Probeer het opnieuw.')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && isAdmin) laadData()
  }, [loading, isAdmin, laadData])

  const totaalAnalyses = data.reduce((s, r) => s + r.totaal, 0)
  const actieveGebruikers = data.length

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
          <h1 className="text-2xl font-bold text-foreground">Analyses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fetching ? 'Laden...' : `${totaalAnalyses} analyses door ${actieveGebruikers} gebruikers`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={laadData}
          disabled={fetching}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${fetching ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      {fout && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fout}
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per gebruiker</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nog geen analyses gevonden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Gebruiker</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Totaal</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="text-emerald-600">Laag</span>
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="text-amber-600">Gemiddeld</span>
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="text-red-600">Hoog</span>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Laatste analyse</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.user_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{r.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {r.plan ? (PLAN_LABELS[r.plan] ?? r.plan) : 'Onbekend'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">{r.totaal}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">{r.laag}</td>
                      <td className="px-6 py-4 text-right text-amber-600 font-medium">{r.gemiddeld}</td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">{r.hoog}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDatum(r.laatste)}</td>
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
