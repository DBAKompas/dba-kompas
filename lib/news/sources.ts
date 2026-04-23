// ─────────────────────────────────────────────────────────────
// lib/news/sources.ts
// RSS-bronconfiguratie voor het nieuwssysteem
// ─────────────────────────────────────────────────────────────

export interface RssSource {
  url: string
  /** Vaste naam voor weergave */
  name: string
  /** Categorie die wordt meegestuurd naar AI als hint */
  categoryHint: string
  /** Prioriteit bij weergave (1 = hoogste) */
  priority: 1 | 2
  /** Als true: altijd DBA-relevant, geen keyword-filter nodig */
  skipFiltering: boolean
}

/**
 * De vijf RSS-bronnen die DBA Kompas volgt.
 * Volgorde = prioriteit: ZZP-specifieke bronnen eerst.
 */
export const RSS_SOURCES: RssSource[] = [
  {
    url: 'https://www.zipconomy.nl/feed/',
    name: 'ZipConomy',
    categoryHint: 'ZZP',
    priority: 1,
    skipFiltering: true, // Dedicated ZZP-bron - altijd relevant
  },
  {
    url: 'https://feeds.rijksoverheid.nl/ministeries/ministerie-van-sociale-zaken-en-werkgelegenheid/nieuws.rss',
    name: 'Min. Sociale Zaken',
    categoryHint: 'Arbeidsrecht',
    priority: 1,
    skipFiltering: true, // Arbeidsmarktbeleid is altijd relevant voor ZZP
  },
  {
    url: 'https://feeds.rijksoverheid.nl/nieuws.rss',
    name: 'Rijksoverheid',
    categoryHint: 'Overheid',
    priority: 2,
    skipFiltering: false, // Filter op ZZP/DBA-relevantie
  },
  {
    url: 'https://feeds.rijksoverheid.nl/ministeries/ministerie-van-financien/nieuws.rss',
    name: 'Min. Financiën',
    categoryHint: 'Fiscaal',
    priority: 2,
    skipFiltering: false, // Filter op belasting/BTW-relevantie
  },
  {
    url: 'https://feeds.rijksoverheid.nl/ministeries/ministerie-van-economische-zaken/nieuws.rss',
    name: 'Min. Economische Zaken',
    categoryHint: 'Economie',
    priority: 2,
    skipFiltering: false,
  },
]

/**
 * Domeinen die als betrouwbaar worden beschouwd.
 * Bronnen buiten deze lijst krijgen is_new = false en een waarschuwing.
 */
export const TRUSTED_DOMAINS = [
  'rijksoverheid.nl',
  'belastingdienst.nl',
  'kvk.nl',
  'rechtspraak.nl',
  'uwv.nl',
  'zipconomy.nl',
  'zzp-nederland.nl',
  'fnv.nl',
  'ondernemersplein.kvk.nl',
  'zzpnederland.nl',
  'vakwerk.nl',
]

export function isSourceReliable(sourceUrl: string | undefined | null): boolean {
  if (!sourceUrl) return false
  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase()
    return TRUSTED_DOMAINS.some(
      domain => hostname === domain || hostname.endsWith('.' + domain)
    )
  } catch {
    return false
  }
}

/**
 * DBA/ZZP-relevante zoekwoorden voor het filteren van generieke overheidsfeeds.
 */
export const DBA_KEYWORDS = [
  'dba', 'deregulering', 'arbeidsrelaties', 'schijnzelfstandigheid',
  'zzp', 'zelfstandig', 'freelance', 'opdrachtnemer', 'opdrachtgever',
  'wet dba', 'arbeidsrecht', 'zelfstandigen', 'ondernemerschap',
  'kvk', 'ondernemersrisico', 'gezagsverhouding', 'facturering',
  'vbar', 'rechtsvermoeden', 'handhaving', 'belastingdienst',
  'inkomstenbelasting', 'btw', 'omzetbelasting', 'kor',
]

/**
 * Zoekwoorden die wijzen op nieuws voor grote organisaties - niet relevant voor ZZP.
 */
export const LARGE_ORG_KEYWORDS = [
  'grootbedrijf', 'multinational', 'concern',
  'bedrijven met meer dan', 'werkgevers met',
  'grote organisaties', 'cao onderhandelingen',
  'vast contract aanbieden', 'personeel in dienst',
]
