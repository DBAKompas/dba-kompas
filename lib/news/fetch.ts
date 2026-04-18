// ─────────────────────────────────────────────────────────────
// lib/news/fetch.ts
// RSS ophalen, filteren, AI-herschrijven en opslaan
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rewriteNewsArticle } from '@/lib/ai/dbaAnalysis'
import {
  RSS_SOURCES,
  isSourceReliable,
  DBA_KEYWORDS,
  LARGE_ORG_KEYWORDS,
  type RssSource,
} from './sources'

// ─── Types ────────────────────────────────────────────────────

interface RawItem {
  title: string
  link: string
  content: string
  pubDate: Date
}

// ─── Normalisatie ─────────────────────────────────────────────

/**
 * Impact altijd normaliseren naar hoog | medium | laag.
 * Fix voor verbeterpunt #3: inconsistente waarden als "hoge", "kritiek", "lage".
 */
function normalizeImpact(raw: string): 'hoog' | 'medium' | 'laag' {
  const v = (raw || '').toLowerCase().trim()
  if (v === 'hoog' || v === 'hoge' || v === 'kritiek' || v === 'high' || v === 'critical') return 'hoog'
  if (v === 'laag' || v === 'lage' || v === 'low') return 'laag'
  return 'medium'
}

/**
 * Categorie altijd als lowercase opslaan.
 * Fix voor verbeterpunt #4: "Belastingdienst" vs "belastingdienst".
 */
function normalizeCategory(raw: string): string {
  return (raw || 'overig').toLowerCase().trim()
}

// ─── RSS XML parser ───────────────────────────────────────────

/**
 * Lichtgewicht RSS-parser zonder externe dependency.
 * Werkt met RSS 2.0 en Atom-feeds van rijksoverheid.nl en zipconomy.nl.
 */
function extractTagContent(xml: string, tag: string): string {
  // CDATA variant
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const cdataMatch = xml.match(cdataRe)
  if (cdataMatch) return cdataMatch[1].trim()

  // Gewone tekst variant
  const textRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const textMatch = xml.match(textRe)
  return textMatch ? textMatch[1].trim() : ''
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRssItems(xml: string): RawItem[] {
  const items: RawItem[] = []

  // Splits op <item> of <entry> (Atom)
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || []

  for (const itemXml of itemMatches) {
    const title = cleanHtml(extractTagContent(itemXml, 'title'))
    const link = extractTagContent(itemXml, 'link') || extractTagContent(itemXml, 'id')
    const rawContent =
      extractTagContent(itemXml, 'content:encoded') ||
      extractTagContent(itemXml, 'description') ||
      extractTagContent(itemXml, 'summary') ||
      extractTagContent(itemXml, 'content')
    const content = cleanHtml(rawContent)
    const pubDateStr =
      extractTagContent(itemXml, 'pubDate') ||
      extractTagContent(itemXml, 'published') ||
      extractTagContent(itemXml, 'updated')

    if (!title) continue

    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date()
    if (isNaN(pubDate.getTime())) continue

    items.push({ title, link, content, pubDate })
  }

  return items
}

// ─── Filtering ────────────────────────────────────────────────

function contentContains(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

function isDbaRelevant(title: string, content: string): boolean {
  return contentContains(title + ' ' + content, DBA_KEYWORDS)
}

function isZzpRelevant(title: string, content: string): boolean {
  return !contentContains(title + ' ' + content, LARGE_ORG_KEYWORDS)
}

function isTooOld(pubDate: Date): boolean {
  // Fix verbeterpunt #2: items ouder dan 12 maanden overslaan
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  return pubDate < twelveMonthsAgo
}

// ─── Hashing ──────────────────────────────────────────────────

function generateContentHash(title: string, pubDate: Date): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${pubDate.toISOString()}`)
    .digest('hex')
}

// ─── Eén bron verwerken ───────────────────────────────────────

async function processSource(source: RssSource): Promise<number> {
  let stored = 0

  let xml: string
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DBAKompas/2.0; +https://dbakompas.nl)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.warn(`[news] ${source.name}: HTTP ${response.status}`)
      return 0
    }
    xml = await response.text()
  } catch (err) {
    console.warn(`[news] ${source.name}: fetch fout —`, err)
    return 0
  }

  const items = parseRssItems(xml).slice(0, 5) // Max 5 per bron

  for (const item of items) {
    try {
      // Fix verbeterpunt #2: sla te oude items over
      if (isTooOld(item.pubDate)) continue

      // Relevantiefilter (alleen voor bronnen die het vereisen)
      if (!source.skipFiltering) {
        if (!isZzpRelevant(item.title, item.content)) continue
        if (!isDbaRelevant(item.title, item.content)) continue
      }

      // Duplicaten detecteren via SHA-256 hash
      const contentHash = generateContentHash(item.title, item.pubDate)
      const { data: existing } = await supabaseAdmin
        .from('news_items')
        .select('id')
        .eq('content_hash', contentHash)
        .single()
      if (existing) continue

      const sourceUrl = item.link || source.url
      const sourceReliable = isSourceReliable(sourceUrl)

      // AI-herschrijving via Claude Haiku (bestaande functie in lib/ai/dbaAnalysis.ts)
      let rewritten: Awaited<ReturnType<typeof rewriteNewsArticle>>
      try {
        rewritten = await rewriteNewsArticle(item.title, item.content, sourceUrl, sourceReliable)
      } catch (aiErr) {
        console.warn(`[news] AI rewrite mislukt voor "${item.title}":`, aiErr)
        // Fallback: ruwe tekst afkappen
        rewritten = {
          title: item.title,
          summary: item.content.slice(0, 200),
          content: item.content.slice(0, 1000),
          category: source.categoryHint,
          impact: 'medium' as const,
          relevantFor: [],
          relevanceReason: '',
        }
      }

      // Fix verbeterpunt #3 + #4: normaliseer impact en categorie
      const impact = normalizeImpact(rewritten.impact)
      const category = normalizeCategory(rewritten.category || source.categoryHint)

      await supabaseAdmin.from('news_items').insert({
        title: rewritten.title,
        summary: rewritten.summary,
        content: rewritten.content,
        category,
        impact,
        source: source.name,
        source_url: sourceUrl,
        source_reliable: sourceReliable,
        relevant_for: rewritten.relevantFor ?? [],
        relevance_reason: rewritten.relevanceReason ?? '',
        content_hash: contentHash,
        is_new: true,
        published_at: item.pubDate.toISOString(),
      })

      stored++
    } catch (err) {
      console.error(`[news] Fout bij verwerken item "${item.title}":`, err)
    }
  }

  console.log(`[news] ${source.name}: ${stored} nieuw opgeslagen`)
  return stored
}

// ─── Cleanup ──────────────────────────────────────────────────

/**
 * Fix verbeterpunt #6: verwijder items ouder dan 12 maanden.
 */
async function cleanupOldItems(): Promise<void> {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)

  const { error, count } = await supabaseAdmin
    .from('news_items')
    .delete({ count: 'exact' })
    .lt('published_at', cutoff.toISOString())

  if (error) {
    console.warn('[news] Cleanup fout:', error.message)
  } else if (count && count > 0) {
    console.log(`[news] Cleanup: ${count} oud(e) items verwijderd`)
  }
}

// ─── Cooldown check ───────────────────────────────────────────

/**
 * Fix verbeterpunt #5: voorkom parallel refreshen door timestamp-check.
 * Retourneert true als de laatste refresh minder dan COOLDOWN_MINUTES geleden was.
 */
const COOLDOWN_MINUTES = 5

export async function isRefreshOnCooldown(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('news_items')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data?.created_at) return false

  const lastFetch = new Date(data.created_at)
  const minutesAgo = (Date.now() - lastFetch.getTime()) / 60_000
  return minutesAgo < COOLDOWN_MINUTES
}

// ─── Hoofdfunctie ─────────────────────────────────────────────

/**
 * Haal nieuws op van alle RSS-bronnen, verwerk het met AI en sla op.
 * Roep aan via de refresh-API-route of de Vercel cron-job.
 */
export async function fetchAndStoreNews(): Promise<{ total: number; sources: number }> {
  let total = 0
  let successfulSources = 0

  for (const source of RSS_SOURCES) {
    const count = await processSource(source)
    if (count >= 0) successfulSources++
    total += count
  }

  // Ruim oude items op na elke run
  await cleanupOldItems()

  console.log(`[news] Klaar: ${total} nieuwe items van ${successfulSources} bronnen`)
  return { total, sources: successfulSources }
}
