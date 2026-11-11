// Extra onderdelen van de analyse (engine v3): weging, gespreksvragen, bronnen en actualiteit.
// Oudere analyses hebben deze gegevens niet; de componenten tonen dan niets.

export interface V3Source {
  titel: string
  ecli: string
  url: string
  bron: 'dossier' | 'vast kader'
  relevantie: string
}

export interface V3Data {
  dossierDatum?: string
  weging?: string
  vragenVoorGesprek?: string[]
  jurisprudentie?: V3Source[]
  actualiteit?: string
  beperkingen?: string
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function V3Weging({ v3 }: { v3?: V3Data | null }) {
  if (!v3?.weging) return null
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">De weging</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Hoe de omstandigheden samen het beeld bepalen, en wat de tekst niet zegt.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{v3.weging}</p>
    </section>
  )
}

export function V3Gesprek({ v3 }: { v3?: V3Data | null }) {
  const vragen = v3?.vragenVoorGesprek ?? []
  if (vragen.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Vragen voor het gesprek</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {vragen.map((vraag, i) => (
          <p key={i} className="flex gap-3 px-5 py-4 text-sm">
            <b className="text-accent">{i + 1}.</b>
            <span>{vraag}</span>
          </p>
        ))}
      </div>
    </section>
  )
}

export function V3Bronnen({ v3 }: { v3?: V3Data | null }) {
  const bronnen = v3?.jurisprudentie ?? []
  if (bronnen.length === 0 && !v3?.actualiteit && !v3?.beperkingen) return null
  const datum = formatDate(v3?.dossierDatum)
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Bronnen en actuele stand</h2>
        {datum && (
          <p className="mt-1 text-xs text-muted-foreground">
            Rechtspraak, handhaving en wetgeving bijgewerkt tot {datum}.
          </p>
        )}
      </div>

      {bronnen.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {bronnen.map((bron, i) => (
            <div key={i} className="px-5 py-4">
              <a
                href={bron.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary underline underline-offset-4 break-words"
              >
                {bron.titel}
              </a>
              {bron.ecli && <span className="ml-2 text-xs text-muted-foreground break-all">{bron.ecli}</span>}
              <p className="mt-1 text-sm text-muted-foreground">{bron.relevantie}</p>
            </div>
          ))}
        </div>
      )}

      {v3?.actualiteit && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Handhaving en wetgeving nu</p>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v3.actualiteit}</p>
        </div>
      )}

      {v3?.beperkingen && (
        <p className="text-xs text-muted-foreground">
          Wat deze analyse niet kan beoordelen: {v3.beperkingen}
        </p>
      )}
    </section>
  )
}
