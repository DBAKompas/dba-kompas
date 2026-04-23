'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

/**
 * Filter-state voor de admin-gebruikerslijst.
 * Alle filters zijn optioneel: lege string of null = geen filter.
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

function heeftActieveFilters(f: GebruikerFilterState): boolean {
  return (
    f.zoek.trim() !== '' ||
    f.plan !== 'alle' ||
    f.abonnementStatus !== 'alle' ||
    f.eenmaligStatus !== 'alle' ||
    f.rol !== 'alle' ||
    f.aangemaaktVan !== '' ||
    f.aangemaaktTot !== '' ||
    f.laatstIngelogdVan !== '' ||
    f.laatstIngelogdTot !== '' ||
    f.laatsteAnalyseVan !== '' ||
    f.laatsteAnalyseTot !== '' ||
    f.laatsteNieuwsVan !== '' ||
    f.laatsteNieuwsTot !== '' ||
    f.minAnalyses.trim() !== ''
  )
}

export function GebruikerFilters({ value, onChange, totaal, zichtbaar }: Props) {
  function update<K extends keyof GebruikerFilterState>(
    key: K,
    v: GebruikerFilterState[K]
  ) {
    onChange({ ...value, [key]: v })
  }

  const actief = heeftActieveFilters(value)

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold">Filters</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {zichtbaar} van {totaal} gebruiker{totaal === 1 ? '' : 's'}
          </span>
          {actief && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(LEGE_FILTERS)}
              className="gap-1 text-xs"
            >
              <X className="size-3" />
              Wis filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="f-zoek" className="text-xs">E-mail zoeken</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
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
        <span className="text-xs text-muted-foreground">t/m</span>
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
