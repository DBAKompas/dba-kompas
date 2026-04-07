'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader2,
} from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  impact: string
  category: string
  published_at: string
}

function getImpactColor(impact: string) {
  switch (impact?.toLowerCase()) {
    case 'hoog':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'laag':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function NieuwsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [impactFilter, setImpactFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        setNews(Array.isArray(data) ? data : data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredNews = news.filter((item) => {
    const matchesImpact =
      impactFilter === 'all' || item.impact?.toLowerCase() === impactFilter
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesImpact && matchesSearch
  })

  const impactOptions = [
    { value: 'all', label: 'Alle' },
    { value: 'hoog', label: 'Hoog' },
    { value: 'medium', label: 'Medium' },
    { value: 'laag', label: 'Laag' },
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nieuws</h1>
        <p className="text-muted-foreground">
          Laatste DBA-gerelateerde nieuwsberichten en updates
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek in nieuws..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="size-4 text-muted-foreground" />
          {impactOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={impactFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImpactFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* News list */}
      {filteredNews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Newspaper className="mx-auto size-10 mb-2" />
            <p>Geen nieuwsberichten gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNews.map((item) => {
            const expanded = expandedItems.has(item.id)
            return (
              <Card key={item.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.summary}</CardDescription>
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${getImpactColor(
                            item.impact
                          )}`}
                        >
                          {item.impact}
                        </span>
                        {item.category && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        )}
                        {item.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.published_at).toLocaleDateString('nl-NL')}
                          </span>
                        )}
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="mt-1 size-4 shrink-0" />
                    ) : (
                      <ChevronDown className="mt-1 size-4 shrink-0" />
                    )}
                  </div>
                </CardHeader>
                {expanded && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {item.content || 'Geen aanvullende inhoud beschikbaar.'}
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
