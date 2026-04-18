'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  impact: 'hoog' | 'medium' | 'laag' | string
  category: string
  source: string | null
  source_url: string | null
  source_reliable: boolean
  is_new: boolean
  published_at: string
  relevant_for: string[]
  relevance_reason: string
}

// ─── Constanten ────────────────────────────────────────────────

const IMPACT_STYLE: Record<string, string> = {
  hoog: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  laag: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
}

const IMPACT_LABEL: Record<string, string> = {
  hoog: 'Hoog',
  medium: 'Medium',
  laag: 'Laag',
}

const THEMES = [
  { key: 'wet-dba', label: 'Wet DBA', keywords: ['dba', 'schijnzelfstandig', 'gezagsverhouding', 'arbeidsrelatie', 'handhaving', 'vbar', 'rechtsvermoeden', 'deregulering'] },
  { key: 'belastingdienst', label: 'Belastingdienst', keywords: ['belasting', 'btw', 'omzetbelasting', 'fiscaal', 'inkomstenbelasting', 'kor', 'belastingdienst'] },
  { key: 'rechtspraak', label: 'Rechtspraak', keywords: ['rechtbank', 'rechter', 'uitspraak', 'rechtspraak', 'arrest', 'vonnis', 'cassatie'] },
  { key: 'zzp', label: 'ZZP', keywords: ['zzp', 'freelance', 'zelfstandig', 'opdrachtnemer', 'opdrachtgever', 'kvk', 'ondernemer'] },
  { key: 'arbeidsmarkt', label: 'Arbeidsmarkt', keywords: ['arbeidsmarkt', 'arbeidsrecht', 'cao', 'loon', 'minimumloon', 'flex', 'pensioen'] },
]

// ─── Hulpfuncties ─────────────────────────────────────────────

function detectTheme(item: NewsItem): string[] {
  const text = `${item.title} ${item.summary} ${item.category} ${item.content}`.toLowerCase()
  return THEMES.filter(t => t.keywords.some(kw => text.includes(kw))).map(t => t.key)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function impactStyle(impact: string): string {
  return IMPACT_STYLE[impact?.toLowerCase()] ?? 'bg-muted text-muted-foreground'
}

// ─── Sub-componenten ──────────────────────────────────────────

function FeedbackButtons({
  itemId,
  feedback,
  onFeedback,
}: {
  itemId: string
  feedback: Record<string, boolean | null>
  onFeedback: (id: string, relevant: boolean | null) => void
}) {
  const current = feedback[itemId]

  async function handleClick(relevant: boolean) {
    const next = current === relevant ? null : relevant
    onFeedback(itemId, next)

    if (next === null) {
      await fetch('/api/news/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemId: itemId }),
      })
    } else {
      await fetch('/api/news/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemId: itemId, isRelevant: next }),
      })
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
      <span className="text-xs text-muted-foreground mr-1">Relevant voor mij?</span>
      <button
        onClick={() => handleClick(true)}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          current === true
            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        }`}
      >
        <ThumbsUp className="size-3" />
        Ja
      </button>
      <button
        onClick={() => handleClick(false)}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          current === false
            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        }`}
      >
        <ThumbsDown className="size-3" />
        Nee
      </button>
    </div>
  )
}

// ─── Hoofdpagina ──────────────────────────────────────────────

export default function NieuwsPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({})

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [impactFilter, setImpactFilter] = useState<string>('all')
  const [themeFilter, setThemeFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)

  // ─── Laden ────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [newsRes, readRes, feedbackRes] = await Promise.all([
        fetch('/api/news?limit=100'),
        fetch('/api/news/read'),
        fetch('/api/news/feedback'),
      ])

      const newsData: NewsItem[] = await newsRes.json()
      const readData: string[] = readRes.ok ? await readRes.json() : []
      const feedbackData: { news_item_id: string; is_relevant: boolean }[] = feedbackRes.ok
        ? await feedbackRes.json()
        : []

      setItems(Array.isArray(newsData) ? newsData : [])
      setReadIds(new Set(Array.isArray(readData) ? readData : []))
      const fbMap: Record<string, boolean | null> = {}
      for (const f of feedbackData) fbMap[f.news_item_id] = f.is_relevant
      setFeedback(fbMap)
    } catch {
      // Stille fout — items blijven leeg
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ─── Uitklappen & leesmarkering ───────────────────────────

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Markeer als gelezen bij uitklappen
        if (!readIds.has(id)) {
          setReadIds(r => new Set([...r, id]))
          fetch('/api/news/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newsItemId: id }),
          }).catch(() => {})
        }
      }
      return next
    })
  }

  // ─── Feedback ─────────────────────────────────────────────

  function handleFeedback(id: string, relevant: boolean | null) {
    setFeedback(prev => ({ ...prev, [id]: relevant }))
  }

  // ─── Refresh ──────────────────────────────────────────────

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.skipped) {
        setRefreshMsg('Nieuws is recentelijk al bijgewerkt.')
      } else if (data.newItems !== undefined) {
        setRefreshMsg(
          data.newItems === 0
            ? 'Geen nieuwe berichten gevonden.'
            : `${data.newItems} nieuw${data.newItems === 1 ? ' bericht' : 'e berichten'} toegevoegd.`
        )
        if (data.newItems > 0) await loadAll()
      }
    } catch {
      setRefreshMsg('Vernieuwen mislukt, probeer later opnieuw.')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 5000)
    }
  }

  // ─── Unieke bronnen ───────────────────────────────────────

  const sources = useMemo(() => {
    const s = new Set(items.map(i => i.source).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [items])

  // ─── Filtering ────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (impactFilter !== 'all' && item.impact?.toLowerCase() !== impactFilter) return false
      if (unreadOnly && readIds.has(item.id)) return false
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false

      if (themeFilter !== 'all') {
        const themes = detectTheme(item)
        if (!themes.includes(themeFilter)) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inText =
          item.title?.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
        if (!inText) return false
      }

      return true
    })
  }, [items, impactFilter, themeFilter, sourceFilter, unreadOnly, readIds, searchQuery])

  const unreadCount = useMemo(
    () => items.filter(i => !readIds.has(i.id)).length,
    [items, readIds]
  )

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="size-6 text-primary" />
            Nieuws
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            DBA- en ZZP-nieuws · {items.length} berichten
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {unreadCount} ongelezen
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      </div>

      {refreshMsg && (
        <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          {refreshMsg}
        </p>
      )}

      {/* Zoekbalk */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Zoek in nieuws..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">

        {/* Impact */}
        <div className="flex items-center gap-1">
          {(['all', 'hoog', 'medium', 'laag'] as const).map(v => (
            <button
              key={v}
              onClick={() => setImpactFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                impactFilter === v
                  ? v === 'all'
                    ? 'bg-foreground text-background border-transparent'
                    : `${impactStyle(v)} border-transparent`
                  : 'border-border bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              {v === 'all' ? 'Alle impact' : IMPACT_LABEL[v]}
            </button>
          ))}
        </div>

        {/* Thema's */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setThemeFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              themeFilter === 'all'
                ? 'bg-foreground text-background border-transparent'
                : 'border-border bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            Alle thema&apos;s
          </button>
          {THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => setThemeFilter(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                themeFilter === t.key
                  ? 'bg-primary/10 text-primary border-transparent'
                  : 'border-border bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bron */}
        {sources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Alle bronnen</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* Ongelezen toggle */}
        <button
          onClick={() => setUnreadOnly(v => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            unreadOnly
              ? 'bg-primary/10 text-primary border-transparent'
              : 'border-border bg-background hover:bg-muted text-muted-foreground'
          }`}
        >
          {unreadOnly ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          Ongelezen
        </button>
      </div>

      {/* Resultaatindicator */}
      {(impactFilter !== 'all' || themeFilter !== 'all' || sourceFilter !== 'all' || unreadOnly || searchQuery) && (
        <p className="text-xs text-muted-foreground">
          {filteredItems.length} van {items.length} berichten zichtbaar
          <button
            className="ml-2 underline hover:no-underline"
            onClick={() => {
              setImpactFilter('all')
              setThemeFilter('all')
              setSourceFilter('all')
              setUnreadOnly(false)
              setSearchQuery('')
            }}
          >
            Wis filters
          </button>
        </p>
      )}

      {/* Nieuwslijst */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="mx-auto size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Geen berichten gevonden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => {
            const isExpanded = expanded.has(item.id)
            const isRead = readIds.has(item.id)
            const impact = item.impact?.toLowerCase()

            return (
              <Card
                key={item.id}
                className={`transition-colors ${!isRead ? 'border-primary/30' : ''}`}
              >
                {/* Klikbare header */}
                <button
                  className="w-full text-left px-5 py-4"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Ongelezen indicator */}
                    <div className="mt-1.5 shrink-0">
                      {!isRead ? (
                        <span className="block size-2 rounded-full bg-primary" />
                      ) : (
                        <span className="block size-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta: badges en datum */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${impactStyle(impact)}`}>
                          {IMPACT_LABEL[impact] ?? impact}
                        </span>
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        {item.is_new && !isRead && (
                          <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            Nieuw
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      {/* Titel */}
                      <p className={`font-semibold text-sm leading-snug ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {item.title}
                      </p>

                      {/* Samenvatting (alleen ingeklapt) */}
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 mt-1 text-muted-foreground">
                      {isExpanded
                        ? <ChevronUp className="size-4" />
                        : <ChevronDown className="size-4" />}
                    </div>
                  </div>
                </button>

                {/* Uitgeklapte inhoud */}
                {isExpanded && (
                  <CardContent className="px-5 pb-5 pt-0">
                    <div className="ml-5 space-y-3">

                      {/* Samenvatting */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Volledige inhoud */}
                      {item.content && item.content !== item.summary && (
                        <div className="text-sm leading-relaxed whitespace-pre-line border-t border-border/50 pt-3">
                          {item.content}
                        </div>
                      )}

                      {/* Relevantiereden */}
                      {item.relevance_reason && (
                        <div className="rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground border border-primary/10">
                          <span className="font-medium text-primary">Waarom relevant:</span> {item.relevance_reason}
                        </div>
                      )}

                      {/* Bronvermelding */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {!item.source_reliable && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3" />
                            Niet-geverifieerde bron
                          </span>
                        )}
                        {item.source && (
                          <span>Bron: {item.source}</span>
                        )}
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            Origineel artikel
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      {/* Feedback */}
                      <FeedbackButtons
                        itemId={item.id}
                        feedback={feedback}
                        onFeedback={handleFeedback}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
