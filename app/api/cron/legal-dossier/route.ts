import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createAlert } from '@/lib/admin/alerts'

/**
 * Vercel Cron: stelt dagelijks het jurisprudentiedossier samen.
 *
 * Opus zoekt op officiële bronnen naar recente uitspraken en de stand van handhaving
 * en wetgeving. Alleen items waarvan de URL letterlijk in de zoekresultaten stond
 * worden opgeslagen. De analyse (lib/ai/dbaEngineV3.ts) leest het nieuwste dossier.
 *
 * Auth via CRON_SECRET (Vercel stuurt dit mee als Bearer token).
 */
export const maxDuration = 300

const MODEL = process.env.DBA_DOSSIER_MODEL || 'claude-opus-5-5'
const ALLOWED_DOMAINS = [
  'rechtspraak.nl',
  'uitspraken.rechtspraak.nl',
  'hogeraad.nl',
  'belastingdienst.nl',
  'rijksoverheid.nl',
  'tweedekamer.nl',
]

const SYSTEM = `Je bent juridisch onderzoeker voor DBA Kompas. Je stelt het dagdossier samen: een actueel, feitelijk overzicht van rechtspraak, handhaving en wetgeving over de kwalificatie van arbeidsrelaties van zzp'ers in Nederland (art. 7:610 BW, Wet DBA, loonheffingen, schijnzelfstandigheid).

Regels:
- Gebruik de zoekfunctie. Neem alleen op wat je in de zoekresultaten hebt gevonden. Verzin nooit een uitspraak, ECLI, datum of citaat.
- Geef bij elk item de URL exact zoals die in het zoekresultaat stond.
- Kon je iets niet vinden of niet bevestigen, laat het weg.
- Schrijf feitelijk en kort, in het Nederlands. Geen advies.

Geef uitsluitend één JSON-object, zonder tekst ervoor of erna:
{
  "rechtspraak": [{"titel": "instantie en datum", "ecli": "", "url": "", "sector": "bijv. zorg, IT, overheid, bouw, onderwijs, algemeen", "kern": "2 tot 3 zinnen: wat is beslist en op welke omstandigheden", "betekenis": "1 zin: wat dit betekent voor de beoordeling van een opdracht"}],
  "handhaving": [{"punt": "", "url": "", "toelichting": "1 tot 2 zinnen"}],
  "wetgeving": [{"voorstel": "", "stand": "1 tot 2 zinnen over de actuele stand", "url": ""}]
}`

const TASK = `Stel het dagdossier van vandaag samen. Zoek de meest recente uitspraken (laatste twaalf maanden, met voorrang voor de laatste drie) van de Hoge Raad, gerechtshoven en rechtbanken over de vraag of een zzp'er of opdrachtnemer in dienstbetrekking werkt, in verschillende sectoren. Zoek daarnaast de actuele stand van de handhaving door de Belastingdienst op schijnzelfstandigheid en van de wetsvoorstellen Wet VBAR en Zelfstandigenwet. Maximaal acht zoekopdrachten, hoogstens tien uitspraken.`

type Item = Record<string, unknown>

function normalizeUrl(url: string): string {
  try {
    return decodeURIComponent(url.replace(/&amp;/g, '&')).trim()
  } catch {
    return url.trim()
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 14000,
        system: SYSTEM,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 8,
            allowed_domains: ALLOWED_DOMAINS,
            user_location: { type: 'approximate', country: 'NL', timezone: 'Europe/Amsterdam' },
          },
        ],
        messages: [{ role: 'user', content: TASK }],
      }),
    })

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`)
    const data = (await res.json()) as {
      content: Array<Record<string, unknown>>
      stop_reason?: string
      usage?: { server_tool_use?: { web_search_requests?: number } }
    }

    // Verzamel alle URL's uit de zoekresultaten en de tekst na de laatste zoekopdracht.
    const foundUrls = new Set<string>()
    let text = ''
    for (const block of data.content) {
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const r of block.content as Array<Record<string, unknown>>) {
          if (typeof r.url === 'string') foundUrls.add(normalizeUrl(r.url))
        }
        text = ''
      } else if (block.type === 'server_tool_use') {
        text = ''
      } else if (block.type === 'text' && typeof block.text === 'string') {
        text += block.text
      }
    }

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error(`geen JSON in antwoord (stop: ${data.stop_reason})`)
    const parsed = JSON.parse(match[0]) as Record<string, unknown>

    // Harde controle: alleen items waarvan de URL echt in een zoekresultaat stond.
    const verified = (list: unknown): Item[] =>
      Array.isArray(list)
        ? (list as Item[]).filter((item) => typeof item?.url === 'string' && foundUrls.has(normalizeUrl(item.url as string)))
        : []

    const content = {
      datum: new Date().toISOString().slice(0, 10),
      rechtspraak: verified(parsed.rechtspraak).slice(0, 10),
      handhaving: verified(parsed.handhaving).slice(0, 8),
      wetgeving: verified(parsed.wetgeving).slice(0, 6),
    }

    if (content.rechtspraak.length + content.handhaving.length + content.wetgeving.length < 3) {
      throw new Error('te weinig geverifieerde bronnen, dossier van gisteren blijft actief')
    }

    const { error } = await supabaseAdmin.from('legal_dossiers').insert({
      content,
      sources: Array.from(foundUrls),
      model: MODEL,
      search_count: data.usage?.server_tool_use?.web_search_requests ?? null,
    })
    if (error) throw new Error(`opslaan mislukt: ${error.message}`)

    return NextResponse.json({
      ok: true,
      rechtspraak: content.rechtspraak.length,
      handhaving: content.handhaving.length,
      wetgeving: content.wetgeving.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/legal-dossier]', message)
    await createAlert({
      type: 'cron_failed',
      severity: 'warning',
      title: 'Cron legal-dossier: dossier niet bijgewerkt',
      message,
      metadata: { job: 'legal-dossier' },
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
