'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Mail,
  ExternalLink,
  Send,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const POSTMARK_DASHBOARD = 'https://account.postmarkapp.com/servers'

const welcomeTemplates = [
  {
    id: 'one_time',
    label: 'Eenmalige check',
    subject: 'DBA Kompas - Je check staat klaar',
    trigger: 'Direct na aankoop eenmalige check',
    alias: 'welkomstmail-eenmalig',
  },
  {
    id: 'monthly',
    label: 'Maandabonnement',
    subject: 'DBA Kompas - Je maandabonnement is actief',
    trigger: 'Direct na afsluiten maandabonnement',
    alias: 'welkomstmail-maand',
  },
  {
    id: 'yearly',
    label: 'Jaarabonnement',
    subject: 'DBA Kompas - Je jaarabonnement is actief',
    trigger: 'Direct na afsluiten jaarabonnement',
    alias: 'welkomstmail-jaar',
  },
]

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-amber-500/10 text-amber-600'
      }`}
    >
      {active ? (
        <CheckCircle className="size-3" />
      ) : (
        <Clock className="size-3" />
      )}
      {active ? 'Actief' : 'Inactief'}
    </span>
  )
}

function DigestCard({
  label,
  schedule,
  description,
}: {
  label: string
  schedule: string
  description: string
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const handleSendTest = async () => {
    setSending(true)
    setError('')
    setSent(false)
    try {
      const res = await fetch('/api/admin/send-test-digest', { method: 'POST' })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Verzenden mislukt')
      }
    } catch {
      setError('Netwerkfout')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <StatusBadge active={false} />
      </div>

      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Nog niet geactiveerd</p>
            <p className="mt-0.5 text-amber-600/80">
              Zet <code className="font-mono bg-amber-500/10 px-1 rounded text-xs">DIGEST_ENABLED=true</code> in Vercel om de automatische verzending aan te zetten. Schema: {schedule}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
        <div>
          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-0.5">Schema</span>
          {schedule}
        </div>
        <div>
          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-0.5">Ontvangers</span>
          Alle actieve abonnees
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="size-4" />
          {showPreview ? 'Verberg preview' : 'Toon preview'}
          {showPreview ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSendTest}
          disabled={sending || sent}
          className="gap-2"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : sent ? (
            <CheckCircle className="size-4 text-emerald-500" />
          ) : (
            <Send className="size-4" />
          )}
          {sent ? 'Verstuurd!' : 'Stuur testmail naar mezelf'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {showPreview && (
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
            <Eye className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Preview met voorbeelddata</span>
          </div>
          <iframe
            src="/api/admin/email-preview?type=weekly"
            className="w-full"
            style={{ height: '600px', border: 'none' }}
            title="E-mail preview"
          />
        </div>
      )}
    </div>
  )
}

export default function AdminEmailsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-mailbeheer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overzicht van alle e-mails die vanuit DBA Kompas worden verstuurd.
        </p>
      </div>

      {/* Welkomstmails */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Welkomstmails
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Automatisch verstuurd via Postmark direct na aankoop. Bewerk het ontwerp en de inhoud in het Postmark-dashboard.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {welcomeTemplates.map((tpl) => (
            <div key={tpl.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{tpl.label}</h3>
                <StatusBadge active={true} />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/60">Onderwerp</span>
                  <p className="mt-0.5 leading-snug">{tpl.subject}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/60">Trigger</span>
                  <p className="mt-0.5 leading-snug">{tpl.trigger}</p>
                </div>
              </div>
              <a href={POSTMARK_DASHBOARD} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <ExternalLink className="size-3.5" />
                  Bewerk in Postmark
                </Button>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Digest mails */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Digest mails
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Periodieke samenvattingen naar alle actieve abonnees. Nog niet actief - eerst inrichten, dan aanzetten.
          </p>
        </div>

        <div className="space-y-4">
          <DigestCard
            label="Wekelijkse digest"
            schedule="Elke maandag om 09:00"
            description="Laatste nieuwsitems, DBA-analyse-overzicht en ongelezen meldingen."
          />
          <DigestCard
            label="Maandelijkse digest"
            schedule="Elke 1e van de maand om 09:00"
            description="Maandoverzicht van nieuwsitems, analyses en meldingen."
          />
        </div>
      </section>
    </div>
  )
}
