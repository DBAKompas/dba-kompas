'use client'

/**
 * InfoTooltip — subtiel (i)-icoon met hover-uitleg.
 *
 * Gebruik: direct achter een begrip in de tekst.
 * Voeg NIET toe als het begrip op dezelfde pagina al uitgelegd wordt.
 *
 * Voorbeeld:
 *   <span>Gezagsverhouding<InfoTooltip explanation="Als een opdrachtgever..." /></span>
 */

import { Info } from 'lucide-react'

interface InfoTooltipProps {
  explanation: string
  className?: string
}

export function InfoTooltip({ explanation, className }: InfoTooltipProps) {
  return (
    <span className={`relative inline-flex items-center group/tip align-middle ${className ?? ''}`}>
      <Info
        className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors ml-1"
        aria-label="Toelichting"
      />
      {/* Tooltip — verschijnt boven het icoon, valt terug naar onder via Tailwind */}
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute z-50 whitespace-normal',
          'bottom-full left-1/2 -translate-x-1/2 mb-2',
          'w-64 max-w-xs rounded-lg',
          'bg-popover border border-border shadow-md',
          'px-3 py-2 text-xs text-popover-foreground leading-relaxed',
          'opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150',
        ].join(' ')}
      >
        {explanation}
        {/* Pijltje omlaag */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
      </span>
    </span>
  )
}

// ── Centraal woordenboek van DBA-begrippen ─────────────────────────────────
// Eén plek om uitleg bij te werken. Gebruik DBA_GLOSSARY['sleutel'] om een
// tooltip te renderen zonder de uitleg te herhalen.

export const DBA_GLOSSARY = {
  wetDba:
    'De Wet Deregulering Beoordeling Arbeidsrelaties (2016). Bepaalt wanneer een zzp-opdracht als arbeidsrelatie wordt gezien in plaats van zelfstandig werk.',
  gezagsverhouding:
    'Als een opdrachtgever bepaalt hoe je het werk uitvoert (niet alleen wat), is er sprake van gezag. Dat is een signaal voor een arbeidsrelatie.',
  schijnzelfstandigheid:
    'Wanneer iemand formeel als zzp\'er werkt, maar feitelijk als werknemer functioneert. Dit is het belangrijkste risico dat de Belastingdienst controleert.',
  inbedding:
    'De mate waarin je werkzaamheden structureel onderdeel zijn van de organisatie van de opdrachtgever. Hoe meer ingebed, hoe groter het risico.',
  eigenRekeningRisico:
    'Je loopt als zzp\'er financieel risico: bij tegenvallende resultaten of aansprakelijkheid draag je dat zelf. Ontbreekt dit, dan wijst dat op dienstverband.',
  directeAansturing:
    'Wanneer een opdrachtgever dagelijks of structureel aangeeft wat en hoe je iets moet doen. Een sterke aanwijzing voor gezag.',
  handhavingsmoratorium:
    'Periode waarin de Belastingdienst niet actief handhaafde op schijnzelfstandigheid. Dit moratorium is per 1 januari 2025 beëindigd.',
  modelovereenkomst:
    'Een door de Belastingdienst goedgekeurde contractvorm die bij correct gebruik buiten het bereik van de Wet DBA valt.',
  opdrachtgeverAansprakelijkheid:
    'Als jouw opdracht als arbeidsrelatie wordt beoordeeld, kan de opdrachtgever naheffingen voor loonheffingen en premies krijgen.',
  risicosignaal:
    'Een element in de opdracht dat wijst op een arbeidsrelatie in plaats van zelfstandig werk. Meerdere signalen tegelijk verhogen het totale risico.',
} as const
