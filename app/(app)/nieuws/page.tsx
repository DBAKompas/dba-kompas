'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Search, Filter, Eye, RefreshCw, Loader2, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, AlertTriangle, ExternalLink, Info, X, Link2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  impact: string
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
  hoog: 'bg-red-600 text-white',
  medium: 'bg-primary text-primary-foreground',
  laag: 'bg-emerald-600 text-white',
}

const THEMES = [
  { key: 'wet-dba',       label: 'Wet DBA',        keywords: ['dba', 'schijnzelfstandig', 'gezagsverhouding', 'handhaving', 'vbar'] },
  { key: 'belastingdienst', label: 'Belastingdienst', keywords: ['belasting', 'btw', 'fiscaal', 'inkomstenbelasting', 'kor'] },
  { key: 'rechtspraak',   label: 'Rechtspraak',    keywords: ['rechtbank', 'rechter', 'uitspraak', 'arrest', 'vonnis'] },
  { key: 'markt',         label: 'Markt & Economie', keywords: ['zzp', 'freelance', 'zelfstandig', 'kvk', 'ondernemer', 'arbeidsmarkt'] },
  { key: 'btw',           label: 'BTW',            keywords: ['btw', 'omzetbelasting', 'kor', 'btw-aangifte'] },
  { key: 'pensioen',      label: 'Pensioen',       keywords: ['pensioen', 'aow', 'pensioenwet', 'pensioenopbouw'] },
]

const DATE_OPTIONS = [
  { key: 'all',   label: 'Alle' },
  { key: 'today', label: 'Vandaag' },
  { key: 'week',  label: 'Deze week' },
  { key: 'month', label: 'Deze maand' },
  { key: '3m',    label: 'Afgelopen 3 maanden' },
]

// ─── Hulpfuncties ─────────────────────────────────────────────

function detectTheme(item: NewsItem): string[] {
  const text = `${item.title} ${item.summary} ${item.category} ${item.content}`.toLowerCase()
  return THEMES.filter(t => t.keywords.some(kw => text.includes(kw))).map(t => t.key)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isWithinDateFilter(published: string, filter: string): boolean {
  if (filter === 'all') return true
  const now = new Date()
  const date = new Date(published)
  if (filter === 'today') {
    return date.toDateString() === now.toDateString()
  }
  if (filter === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date >= weekAgo
  }
  if (filter === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  if (filter === '3m') {
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return date >= threeMonthsAgo
  }
  return true
}

// ─── Feedback knopjes ─────────────────────────────────────────

function FeedbackRow({ itemId, feedback, onFeedback }: {
  itemId: string
  feedback: Record<string, boolean | null>
  onFeedback: (id: string, relevant: boolean | null) => void
}) {
  const current = feedback[itemId]

  async function toggle(relevant: boolean) {
    const next = current === relevant ? null : relevant
    onFeedback(itemId, next)
    if (next === null) {
      await fetch('/api/news/feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newsItemId: itemId }) })
    } else {
      await fetch('/api/news/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newsItemId: itemId, isRelevant: next }) })
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
      <span className="text-xs text-muted-foreground mr-1">Relevant voor mij?</span>
      <button onClick={() => toggle(true)} className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${current === true ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
        <ThumbsUp className="size-3" /> Ja
      </button>
      <button onClick={() => toggle(false)} className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${current === false ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
        <ThumbsDown className="size-3" /> Nee
      </button>
    </div>
  )
}

// ─── Hoofdpagina ──────────────────────────────────────────────

export default function NieuwsPage() {
  const [items, setItems]       = useState<NewsItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  const [readIds, setReadIds]   = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Filters
  const [searchQuery, setSearchQuery]   = useState('')
  const [filtersOpen, setFiltersOpen]   = useState(false)
  const [impactFilter, setImpactFilter] = useState('all')
  const [themeFilters, setThemeFilters] = useState<string[]>([])
  const [sourceFilters, setSourceFilters] = useState<string[]>([])
  const [dateFilter, setDateFilter]     = useState('all')
  const [unreadOnly, setUnreadOnly]     = useState(false)

  // ─── Laden ──────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [newsRes, readRes, fbRes] = await Promise.all([
        fetch('/api/news?limit=100'),
        fetch('/api/news/read'),
        fetch('/api/news/feedback'),
      ])
      const newsData: NewsItem[] = await newsRes.json()
      const readData: string[] = readRes.ok ? await readRes.json() : []
      const fbData: { news_item_id: string; is_relevant: boolean }[] = fbRes.ok ? await fbRes.json() : []

      setItems(Array.isArray(newsData) ? newsData : [])
      setReadIds(new Set(Array.isArray(readData) ? readData : []))
      const fbMap: Record<string, boolean | null> = {}
      for (const f of fbData) fbMap[f.news_item_id] = f.is_relevant
      setFeedback(fbMap)
    } catch { /* stille fout */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Uitklappen + leesmarkering ─────────────────────────────

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!readIds.has(id)) {
          setReadIds(r => new Set([...r, id]))
          fetch('/api/news/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newsItemId: id }) }).catch(() => {})
        }
      }
      return next
    })
  }

  // ─── Refresh ────────────────────────────────────────────────

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' })
      const data = await res.json()
      if (data.skipped) {
        setRefreshMsg('Recentelijk al bijgewerkt.')
      } else if (data.newItems !== undefined) {
        setRefreshMsg(data.newItems === 0 ? 'Geen nieuwe berichten.' : `${data.newItems} nieuwe berichten toegevoegd.`)
        if (data.newItems > 0) await loadAll()
      }
    } catch {
      setRefreshMsg('Vernieuwen mislukt.')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 5000)
    }
  }

  // ─── Afgeleid ───────────────────────────────────────────────

  const sources = useMemo(() => Array.from(new Set(items.map(i => i.source).filter(Boolean) as string[])).sort(), [items])

  const activeFilterCount = useMemo(() => [
    impactFilter !== 'all',
    themeFilters.length > 0,
    sourceFilters.length > 0,
    dateFilter !== 'all',
    unreadOnly,
  ].filter(Boolean).length, [impactFilter, themeFilters, sourceFilters, dateFilter, unreadOnly])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (impactFilter !== 'all' && item.impact?.toLowerCase() !== impactFilter) return false
      if (unreadOnly && readIds.has(item.id)) return false
      if (sourceFilters.length > 0 && !sourceFilters.includes(item.source ?? '')) return false
      if (dateFilter !== 'all' && !isWithinDateFilter(item.published_at, dateFilter)) return false
      if (themeFilters.length > 0) {
        const themes = detectTheme(item)
        if (!themeFilters.some(tf => themes.includes(tf))) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!item.title?.toLowerCase().includes(q) && !item.summary?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, impactFilter, themeFilters, sourceFilters, dateFilter, unreadOnly, readIds, searchQuery])

  const unreadCount = useMemo(() => items.filter(i => !readIds.has(i.id)).length, [items, readIds])

  function resetFilters() {
    setImpactFilter('all')
    setThemeFilters([])
    setSourceFilters([])
    setDateFilter('all')
    setUnreadOnly(false)
  }

  // ─── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary/40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nieuws Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            DBA- en ZZP-nieuws · {items.length} berichten
          </p>
        </div>
      </div>

      {refreshMsg && (
        <div className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2.5">
          {refreshMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Zoekbalk */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Zoeken..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-full bg-card"
          />
        </div>

        {/* Filters knop */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <Filter className="size-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Ongelezen */}
        <button
          onClick={() => setUnreadOnly(v => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            unreadOnly
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <Eye className="size-3.5" />
          Ongelezen
          {unreadCount > 0 && (
            <span className={`flex size-5 items-center justify-center rounded-full text-xs font-bold ${unreadOnly ? 'bg-white/20' : 'bg-primary text-primary-foreground'}`}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Ververs */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Ververs
        </button>
      </div>

      {/* Filterpaneel */}
      {filtersOpen && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-3" /> Wis alles
              </button>
            )}
          </div>

          {/* Impact */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Impact niveau</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'hoog', 'medium', 'laag'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setImpactFilter(v)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    impactFilter === v
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {v === 'all' ? 'Alle' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Bron */}
          {sources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Bron</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {sources.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sourceFilters.includes(s)}
                      onChange={() => setSourceFilters(prev =>
                        prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                      )}
                      className="size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Thema */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Thema</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {THEMES.map(t => (
                <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={themeFilters.includes(t.key)}
                    onChange={() => setThemeFilters(prev =>
                      prev.includes(t.key) ? prev.filter(x => x !== t.key) : [...prev, t.key]
                    )}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Publicatiedatum */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Publicatiedatum</p>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDateFilter(opt.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    dateFilter === opt.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resultaatindicator */}
      {activeFilterCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredItems.length} van {items.length} berichten zichtbaar
          <button onClick={resetFilters} className="ml-2 underline hover:no-underline">Wis filters</button>
        </p>
      )}

      {/* Nieuwslijst */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground text-sm">Geen berichten gevonden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => {
            const isExpanded = expanded.has(item.id)
            const isRead = readIds.has(item.id)
            const impact = item.impact?.toLowerCase()

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-card transition-all ${!isRead ? 'border-primary/30' : 'border-border'}`}
              >
                {/* Klikbare header */}
                <button
                  className="w-full text-left px-5 py-4"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Ongelezen stip */}
                    <div className="mt-2 shrink-0 size-2">
                      {!isRead && <span className="block size-2 rounded-full bg-primary" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges + datum */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {!isRead && (
                          <span className="rounded-full bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-0.5 uppercase tracking-wide">
                            Nieuw
                          </span>
                        )}
                        {impact && (
                          <span className={`flex items-center gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${IMPACT_STYLE[impact] ?? 'bg-muted text-muted-foreground'}`}>
                            <Info className="size-3" />
                            {impact.charAt(0).toUpperCase() + impact.slice(1)}
                          </span>
                        )}
                        {item.category && (
                          <span className="rounded-full border border-border text-[11px] text-muted-foreground px-2.5 py-0.5">
                            {item.category}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      {/* Titel */}
                      <p className={`font-semibold text-[15px] leading-snug ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {item.title}
                      </p>

                      {/* Samenvatting */}
                      {!isExpanded && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}

                      {/* Bron (ingeklapt) */}
                      {!isExpanded && item.source && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
                          <Link2 className="size-3" />
                          {item.source}
                        </div>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <div className="shrink-0 mt-1 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </div>
                  </div>
                </button>

                {/* Uitgeklapte inhoud */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-5 pb-5 pt-4">
                    <div className="ml-5 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

                      {item.content && item.content !== item.summary && (
                        <p className="text-sm leading-relaxed whitespace-pre-line pt-1">
                          {item.content}
                        </p>
                      )}

                      {item.relevance_reason && (
                        <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">Waarom relevant: </span>
                          {item.relevance_reason}
                        </div>
                      )}

                      {/* Bronvermelding */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {!item.source_reliable && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="size-3" /> Niet-geverifieerde bron
                          </span>
                        )}
                        {item.source && <span>Bron: {item.source}</span>}
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            Origineel artikel <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      <FeedbackRow itemId={item.id} feedback={feedback} onFeedback={(id, v) => setFeedback(prev => ({ ...prev, [id]: v }))} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
