'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const GUIDE_CONTENT: Record<string, { title: string; content: string[] }> = {
  'wat-is-wet-dba': {
    title: 'Wat is de Wet DBA?',
    content: [
      'De Wet Deregulering Beoordeling Arbeidsrelaties (Wet DBA) is in 2016 ingevoerd ter vervanging van de Verklaring Arbeidsrelatie (VAR). Het doel is om schijnzelfstandigheid tegen te gaan en duidelijkheid te scheppen over arbeidsrelaties tussen opdrachtgevers en zzp\'ers.',
      'Onder de Wet DBA zijn zowel de opdrachtgever als de opdrachtnemer verantwoordelijk voor de juiste kwalificatie van hun arbeidsrelatie. Als de Belastingdienst vaststelt dat er sprake is van een dienstbetrekking in plaats van zelfstandig ondernemerschap, kunnen er naheffingen en boetes volgen.',
      'De drie belangrijkste criteria die de Belastingdienst beoordeelt zijn: de mate van gezag (wie bepaalt hoe het werk wordt gedaan), de mogelijkheid tot vervanging (mag de zzp\'er zich laten vervangen), en het ondernemersrisico (draagt de zzp\'er financieel risico).',
      'DBA Kompas helpt je bij het analyseren van je opdrachtomschrijving op basis van deze criteria en geeft concrete verbeterpunten.',
    ],
  },
  'gezagsverhouding': {
    title: 'Gezagsverhouding herkennen',
    content: [
      'Een gezagsverhouding is een van de drie kernkenmerken van een dienstbetrekking. Als er sprake is van een gezagsverhouding, wijst dat op een arbeidsrelatie in plaats van zelfstandig ondernemerschap.',
      'Signalen van een gezagsverhouding zijn onder meer: de opdrachtgever bepaalt werktijden, de opdrachtgever geeft directe instructies over hoe het werk moet worden uitgevoerd, er is sprake van een hiërarchische verhouding, en de opdrachtnemer moet toestemming vragen voor afwezigheid.',
      'Als zelfstandige is het belangrijk om afspraken vast te leggen over wat er wordt opgeleverd (resultaatsverplichting) in plaats van hoe het werk wordt gedaan (inspanningsverplichting).',
    ],
  },
  'zelfstandigheid-aantonen': {
    title: 'Zelfstandigheid aantonen',
    content: [
      'Om je zelfstandigheid als zzp\'er te onderbouwen, zijn er meerdere factoren die je kunt benadrukken in je opdrachtomschrijving en werkwijze.',
      'Werk voor meerdere opdrachtgevers. Dit is een van de sterkste indicatoren van zelfstandigheid. Documenteer je opdrachtenportfolio.',
      'Gebruik je eigen materialen en gereedschap. Werk met je eigen laptop, software-licenties en apparatuur. Factureer geen materiaalkosten aan de opdrachtgever tenzij projectspecifiek.',
      'Draag financieel risico. Dit kan zijn door aansprakelijkheidsverzekering, het risico van onbetaalde uren, of investeringen in je onderneming.',
      'Zorg voor een duidelijke resultaatsverplichting. Definieer oplevermomenten en kwaliteitscriteria in plaats van "beschikbaarheid" of "inzet".',
    ],
  },
  'opdrachtomschrijving-verbeteren': {
    title: 'Opdrachtomschrijving verbeteren',
    content: [
      'Een goede opdrachtomschrijving is cruciaal voor DBA-compliance. De tekst moet duidelijk maken dat er sprake is van een opdracht aan een zelfstandige, niet van een arbeidsrelatie.',
      'Beschrijf het resultaat, niet het proces. In plaats van "de opdrachtnemer werkt van 9-17 op kantoor" schrijf je "de opdrachtnemer levert binnen 6 weken een werkend prototype op".',
      'Vermijd termen die wijzen op een dienstverband. Woorden als "leidinggevende", "functioneringsgesprek", "verlofaanvraag" en "werktijden" zijn rode vlaggen.',
      'Neem een vervangingsclausule op. De mogelijkheid om je te laten vervangen door een andere professional is een sterke indicator van zelfstandigheid.',
      'Gebruik DBA Kompas om je opdrachtomschrijving te laten analyseren en ontvang een verbeterde versie die beter voldoet aan de DBA-criteria.',
    ],
  },
  'handhaving-belastingdienst': {
    title: 'Handhaving door de Belastingdienst',
    content: [
      'Sinds het opheffen van het handhavingsmoratorium controleert de Belastingdienst actiever op schijnzelfstandigheid. Dit betekent dat zowel opdrachtgevers als zzp\'ers risico lopen op naheffingen.',
      'Bij een controle beoordeelt de Belastingdienst de feitelijke situatie, niet alleen de contractuele afspraken. Als de praktijk afwijkt van het contract, kan alsnog een dienstbetrekking worden vastgesteld.',
      'Mogelijke gevolgen zijn: naheffing loonbelasting en premies volksverzekeringen, boetes tot 100% van de naheffing bij opzet, en herziening van eerder toegekende aftrekposten.',
      'Voorbereiding is essentieel. Zorg dat je opdrachtomschrijving klopt, bewaar documentatie van je zelfstandigheid, en evalueer regelmatig of je werkrelatie nog voldoet aan de criteria.',
    ],
  },
}

export default function GuideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const guide = GUIDE_CONTENT[slug]

  if (!guide) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/gidsen')}>
          <ArrowLeft className="size-4 mr-2" />
          Terug naar gidsen
        </Button>
        <p className="text-muted-foreground">Deze gids bestaat niet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => router.push('/gidsen')}>
        <ArrowLeft className="size-4 mr-2" />
        Terug naar gidsen
      </Button>

      <h1 className="text-2xl font-bold">{guide.title}</h1>

      <div className="space-y-4">
        {guide.content.map((paragraph, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
