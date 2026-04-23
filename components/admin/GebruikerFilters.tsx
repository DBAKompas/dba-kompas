'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'

/**
 * Filter-state voor de admin-gebruikerslijst.
 * Alle filters zijn optioneel: lege string of 'alle' = geen filter.
 */
export type GebruikerFilterState = {
  zoek: string
  plan: 'alle' | 'free' | 'one_time' | 'monthly' | 'yearly'
  abonnementStatus: 'alle' | 'actief' | 'loopt_af' | 'inactief' | 'n.v.t.'
  eenmaligStatus:
    | 'alle'
    | 'beschikbaar'
    | 'in_uitvoering'
    | 'vervuld'
    | 'vervallen'
    | 'n.v.t.'
  rol: 'alle' | 'admin' | 'user'
  aangemaaktVan: string
  aangemaaktTot: string
  laatstIngelogdVan: string
  laatstIngelogdTot: string
  laatsteAnalyseVan: string
  laatsteAnalyseTot: string
  laatsteNieuwsVan: string
  laatsteNieuwsTot: string
  minAnalyses: string
}

export const LEGE_FILTERS: GebruikerFilterState = {
  zoek: '',
  plan: 'alle',
  abonnementStatus: 'alle',
  eenmaligStatus: 'alle',
  rol: 'alle',
  aangemaaktVan: '',
  aangemaaktTot: '',
  laatstIngelogdVan: '',
  laatstIngelogdTot: '',
  laatsteAnalyseVan: '',
  laatsteAnalyseTot: '',
  laatsteNieuwsVan: '',
  laatsteNieuwsTot: '',
  minAnalyses: '',
}

type Props = {
  value: GebruikerFilterState
  onChange: (next: GebruikerFilterState) => void
  totaal: number
  zichtbaar: number
}

function telActieveFilters(f: GebruikerFilterState): number {
  let n = 0
  if (f.zoek.trim() !== '') n++
  if (f.plan !== 'alle') n++
  if (f.abonnementStatus !== 'alle') n++
  if (f.eenmaligStatus !== 'alle') n++
  if (f.rol !== 'alle') n++
  if (f.minAnalyses.trim() !== '') n++
  if (f.aangemaaktVan !== '' || f.aangemaaktTot !== '') n++
  if (f.laatstIngelogdVan !== '' || f.laatstIngelogdTot !== '') n++
  if (f.laatsteAnalyseVan !== '' || f.laatsteAnalyseTot !== '') n++
  if (f.laatsteNieuwsVan !== '' || f.laatsteNieuwsTot !== '') n++
  return n
}

export function GebruikerFilters({ value, onChange, totaal, zichtbaar }: Props) {
  const actieveFilters = telActieveFilters(value)
  // Standaard ingeklapt; open automatisch als er al filters actief zijn.
  const [open, setOpen] = useState(actieveFilters > 0)

  function update<K extends keyof GebruikerFilterState>(
    key: K,
    v: GebruikerFilterState[K]
  ) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ─── Header (altijd zichtbaar, klikbaar om te togglen) ──────── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="gebruiker-filters-body"
          className="gap-2"
        >
          <SlidersHorizontal className="size-4" />
          <span className="font-medium">Filters</span>
          {actieveFilters > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
              {actieveFilters} actief
            </span>
          )}
          <ChevronDown
            className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {zichtbaar} van {totaal} gebruiker{totaal === 1 ? '' : 's'}
          </span>
          {actieveFilters > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange(LEGE_FILTERS)}
              className="gap-1"
            >
              <X className="size-3" />
              Wis filters
            </Button>
          )}
        </div>
      </div>

      {/* ─── Body (inklapbaar) ──────────────────────────────────────── */}
      {open && (
        <div
          id="gebruiker-filters-body"
          className="border-t border-border px-5 py-5 space-y-6"
        >
          {/* Sectie 1: Zoeken */}
          <FilterSectie titel="Zoeken">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-2">
                <Label htmlFor="f-zoek" className="text-xs">E-mail</Label>
                <Input
                  id="f-zoek"
                  type="search"
                  placeholder="deel van e-mailadres..."
                  value={value.zoek}
                  onChange={(e) => update('zoek', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="f-plan" className="text-xs">Type plan</Label>
                <Select
                  id="f-plan"
                  value={value.plan}
                  onChange={(e) =>
                    update('plan', e.target.value as GebruikerFilterState['plan'])
                  }
                >
                  <option value="alle">Alle plannen</option>
                  <option value="free">Gratis</option>
                  <option value="one_time">Eenmalig</option>
                  <option value="monthly">Maand</option>
                  <option value="yearly">Jaar</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-rol" className="text-xs">Rol</Label>
                <Select
                  id="f-rol"
                  value={value.rol}
                  onChange={(e) =>
                    update('rol', e.target.value as GebruikerFilterState['rol'])
                  }
                >
                  <option value="alle">Alle rollen</option>
                  <option value="admin">Admin</option>
                  <option value="user">Gebruiker</option>
                </Select>
              </div>
            </div>
          </FilterSectie>

          {/* Sectie 2: Status & activiteit */}
          <FilterSectie titel="Status & activiteit">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="f-abo-status" className="text-xs">Abonnement-status</Label>
                <Select
                  id="f-abo-status"
                  value={value.abonnementStatus}
                  onChange={(e) =>
                    update(
                      'abonnementStatus',
                      e.target.value as GebruikerFilterState['abonnementStatus']
                    )
                  }
                >
                  <option value="alle">Alle</option>
                  <option value="actief">Actief</option>
                  <option value="loopt_af">Loopt af</option>
                  <option value="inactief">Inactief</option>
                  <option value="n.v.t.">Niet van toepassing</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-eenmalig-status" className="text-xs">Eenmalig-status</Label>
                <Select
                  id="f-eenmalig-status"
                  value={value.eenmaligStatus}
                  onChange={(e) =>
                    update(
                      'eenmaligStatus',
                      e.target.value as GebruikerFilterState['eenmaligStatus']
                    )
                  }
                >
                  <option value="alle">Alle</option>
                  <option value="beschikbaar">Beschikbaar</option>
                  <option value="in_uitvoering">In uitvoering</option>
                  <option value="vervuld">Vervuld</option>
                  <option value="vervallen">Vervallen</option>
                  <option value="n.v.t.">Niet van toepassing</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-min-analyses" className="text-xs">Min. aantal analyses</Label>
                <Input
                  id="f-min-analyses"
                  type="number"
                  min={0}
                  placeholder="bijv. 1"
                  value={value.minAnalyses}
                  onChange={(e) => update('minAnalyses', e.target.value)}
                />
              </div>
            </div>
          </FilterSectie>

          {/* Sectie 3: Datumranges */}
          <FilterSectie titel="Datumranges">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateRange
                label="Aangemaakt"
                vanId="f-aangemaakt-van"
                totId="f-aangemaakt-tot"
                van={value.aangemaaktVan}
                tot={value.aangemaaktTot}
                onVan={(v) => update('aangemaaktVan', v)}
                onTot={(v) => update('aangemaaktTot', v)}
              />
              <DateRange
                label="Laatst ingelogd"
                vanId="f-login-van"
                totId="f-login-tot"
                van={value.laatstIngelogdVan}
                tot={value.laatstIngelogdTot}
                onVan={(v) => update('laatstIngelogdVan', v)}
                onTot={(v) => update('laatstIngelogdTot', v)}
              />
              <DateRange
                label="Laatste analyse"
                vanId="f-analyse-van"
                totId="f-analyse-tot"
                van={value.laatsteAnalyseVan}
                tot={value.laatsteAnalyseTot}
                onVan={(v) => update('laatsteAnalyseVan', v)}
                onTot={(v) => update('laatsteAnalyseTot', v)}
              />
              <DateRange
                label="Laatste nieuws gelezen"
                vanId="f-nieuws-van"
                totId="f-nieuws-tot"
                van={value.laatsteNieuwsVan}
                tot={value.laatsteNieuwsTot}
                onVan={(v) => update('laatsteNieuwsVan', v)}
                onTot={(v) => update('laatsteNieuwsTot', v)}
              />
            </div>
          </FilterSectie>
        </div>
      )}
    </div>
  )
}

function FilterSectie({
  titel,
  children,
}: {
  titel: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titel}
      </h3>
      {children}
    </section>
  )
}

function DateRange({
  label,
  vanId,
  totId,
  van,
  tot,
  onVan,
  onTot,
}: {
  label: string
  vanId: string
  totId: string
  van: string
  tot: string
  onVan: (v: string) => void
  onTot: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={vanId}
          type="date"
          aria-label={`${label} van`}
          value={van}
          onChange={(e) => onVan(e.target.value)}
        />
        <span className="text-xs text-muted-foreground shrink-0">t/m</span>
        <Input
          id={totId}
          type="date"
          aria-label={`${label} tot`}
          value={tot}
          onChange={(e) => onTot(e.target.value)}
        />
      </div>
    </div>
  )
}
