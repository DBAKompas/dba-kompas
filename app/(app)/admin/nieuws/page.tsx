'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  Newspaper,
  ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  impact: string
  is_new: boolean
  source: string | null
  source_url: string | null
  published_at: string
  created_at: string
}

interface FormState {
  title: string
  summary: string
  content: string
  category: string
  impact: string
  source: string
  source_url: string
  published_at: string
}

const EMPTY_FORM: FormState = {
  title: '',
  summary: '',
  content: '',
  category: 'Wet DBA',
  impact: 'medium',
  source: '',
  source_url: '',
  published_at: new Date().toISOString().slice(0, 10),
}

const CATEGORIES = ['Wet DBA', 'Handhaving', 'Rechtspraak', 'Fiscaal', 'Ondernemen', 'Overig']
const IMPACTS = [
  { value: 'hoog', label: 'Hoog', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'laag', label: 'Laag', color: 'bg-green-100 text-green-700' },
]

function impactColor(impact: string) {
  return IMPACTS.find(i => i.value === impact)?.color ?? 'bg-muted text-muted-foreground'
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminNieuwsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<NewsItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Formulier state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formContent, setFormContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard')
    }
  }, [loading, user, isAdmin, router])

  const fetchItems = useCallback(async () => {
    setFetching(true)
    const res = await fetch('/api/admin/nieuws')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setFetching(false)
  }, [])

  useEffect(() => {
    if (user && isAdmin) fetchItems()
  }, [user, isAdmin, fetchItems])

  // ─── Formulier handlers ──────────────────────────────────

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormContent('')
    setError(null)
    setShowForm(true)
  }

  function openEdit(item: NewsItem) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      summary: item.summary,
      content: '',
      category: item.category,
      impact: item.impact,
      source: item.source ?? '',
      source_url: item.source_url ?? '',
      published_at: item.published_at.slice(0, 10),
    })
    // Haal volledige content op
    fetch(`/api/admin/nieuws?id=${item.id}`)
      .then(r => r.json())
      .then(d => setFormContent(d.content ?? ''))
      .catch(() => setFormContent(''))
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormContent('')
    setError(null)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.summary.trim() || !formContent.trim()) {
      setError('Titel, samenvatting en inhoud zijn verplicht.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, content: formContent, published_at: new Date(form.published_at).toISOString() }
      const res = editingId
        ? await fetch('/api/admin/nieuws', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        : await fetch('/api/admin/nieuws', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Opslaan mislukt.')
        return
      }
      closeForm()
      await fetchItems()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return
    setDeleting(id)
    await fetch('/api/admin/nieuws', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setDeleting(null)
    await fetchItems()
  }

  // ─── Render ──────────────────────────────────────────────

  if (loading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="-ml-2">
            <ArrowLeft className="size-4 mr-1.5" />
            Control Tower
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="size-6 text-primary" />
            Nieuwsbeheer
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {items.length} {items.length === 1 ? 'bericht' : 'berichten'} gepubliceerd
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Nieuw bericht
        </Button>
      </div>

      {/* Formulier */}
      {showForm && (
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingId ? 'Bericht bewerken' : 'Nieuw nieuwsbericht'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titel */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Titel *</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Belastingdienst start controles op schijnzelfstandigheid"
              />
            </div>

            {/* Samenvatting */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Samenvatting * <span className="text-muted-foreground font-normal">(zichtbaar in overzicht)</span></label>
              <Textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Korte samenvatting die in de nieuwslijst wordt getoond..."
                rows={2}
              />
            </div>

            {/* Inhoud */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Volledige inhoud * <span className="text-muted-foreground font-normal">(zichtbaar na uitklappen)</span></label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Uitgebreide toelichting op het nieuws en wat het betekent voor zzp'ers..."
                rows={5}
              />
            </div>

            {/* Categorie + Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Categorie *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Impact *</label>
                <div className="flex gap-2">
                  {IMPACTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, impact: opt.value }))}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-all ${
                        form.impact === opt.value
                          ? `${opt.color} border-transparent ring-2 ring-offset-1 ring-primary/40`
                          : 'border-input bg-background hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bron + URL + Datum */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bron</label>
                <Input
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Belastingdienst"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bron URL</label>
                <Input
                  value={form.source_url}
                  onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Publicatiedatum</label>
                <Input
                  type="date"
                  value={form.published_at}
                  onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
                />
              </div>
            </div>

            {/* Foutmelding */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            {/* Actieknoppen */}
            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                {editingId ? 'Wijzigingen opslaan' : 'Bericht publiceren'}
              </Button>
              <Button variant="outline" onClick={closeForm} disabled={saving}>
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Berichtenlijst */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="mx-auto size-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nog geen nieuwsberichten. Klik op "Nieuw bericht" om te beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="hover:border-border/80 transition-colors">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${impactColor(item.impact)}`}>
                        {item.impact}
                      </span>
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDatum(item.published_at)}
                      </span>
                      {item.is_new && (
                        <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Nieuw
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.summary}</p>
                    {item.source && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[11px] text-muted-foreground">Bron: {item.source}</span>
                        {item.source_url && (
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      {deleting === item.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Trash2 className="size-3.5" />
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
