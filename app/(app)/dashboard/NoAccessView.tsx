'use client'

import Link from 'next/link'
import { Gift, ArrowRight, Sparkles, Tag } from 'lucide-react'

interface NoAccessViewProps {
  availableCodes: number
}

/**
 * Wordt getoond op /dashboard wanneer de gebruiker geen actieve
 * toegang heeft: geen abonnement, geen ongebruikte one-time credit,
 * geen admin-rol.
 *
 * Toont twee paden naar voren:
 *   1. Upgrade naar een abonnement via /profiel.
 *   2. Gratis toegang verdienen via referral-codes op /beloningen.
 */
export function NoAccessView({ availableCodes }: NoAccessViewProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welkom terug</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Jouw gratis check is verbruikt. Kies hoe je verder wilt met DBA Kompas.
        </p>
      </div>

      {/* Upgrade-blok */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Sparkles className="size-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-orange-900">
              Doorgaan met een abonnement
            </p>
            <p className="text-sm text-orange-800/90 leading-relaxed">
              Maandelijks of jaarlijks abonnement. Onbeperkt analyses,
              volledige nieuwsfeed en notificaties bij DBA-updates.
            </p>
          </div>
        </div>
        <Link
          href="/profiel"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          Bekijk abonnementen
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Referral-blok */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Gift className="size-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-base font-semibold">
              Of verdien gratis toegang
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deel een van jouw uitnodigingscodes. Elke succesvolle
              doorverwijzing telt mee voor een mijlpaal-beloning
              (1 = gratis check, 3 = 1 maand, 5 = 2 maanden).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/beloningen"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Naar mijn codes
            <ArrowRight className="size-4" />
          </Link>
          {availableCodes > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              <Tag className="size-3" />
              {availableCodes} {availableCodes === 1 ? 'code' : 'codes'} beschikbaar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
