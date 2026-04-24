'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Mail,
  MailCheck,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// ── Types ──────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info'
type AlertStatus = 'open' | 'resolved' | 'all'

interface Alert {
  id: string
  type: string
  severity: Severity
  title: string
  message: string
  metadata: Record<string, unknown>
  email_sent: boolean
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

// ── Styling helpers ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, {
  label: string
  icon: React.ElementType
  iconColor: string
  badge: string
  border: string
  headerBg: string
}> = {
  critical: {
    label: 'KRITIEK',
    icon: XCircle,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    headerBg: 'bg-red-50',
  },
  warning: {
    label: 'Waarschuwing',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    headerBg: 'bg-amber-50',
  },
  info: {
    label: 'Info',
    icon: Info,
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    headerBg: 'bg-blue-50',
  },
}

const TYPE_LABELS: Record<string, string> = {
  payment_failed:   'Betaling mislukt',
  cron_failed:      'Cron mislukt',
  analysis_error:   'Analyse fout',
  webhook_error:    'Webhook fout',
  referral_error:   'Referral fout',
  admin_promoted:   'Admin gepromoveerd',
  general:          'Algemeen',
}

// ── Fix-adviezen per alert type ────────────────────────────────────────────────
//
// Elk advies bevat een korte diagnose en concrete actiestappen.

const FIX_ADVICE: Record<string, { diagnose: string; steps: string[] }> = {
  payment_failed: {
    diagnose: 'Een betaling is mislukt. Dit kan door een verlopen kaart, onvoldoende saldo of een Stripe-afwijzing komen.',
    steps: [
      'Open het Stripe-dashboard → Betalingen → zoek op user_id uit de metadata.',
      'Bekijk de webhook-events voor invoice.payment_failed of charge.failed.',
      'Controleer of de gebruiker een geldig betaalmiddel heeft ingesteld.',
      'Stuur eventueel handmatig een betaalherinnering via Stripe of via de gebruikerspagina.',
    ],
  },
  cron_failed: {
    diagnose: 'Een geplande taak (cron) is mislukt of heeft geen HTTP 200 teruggegeven.',
    steps: [
      'Ga naar GitHub → DBAKompas/dba-kompas → Actions → kijk naar de mislukte workflow run.',
      'Controleer of PRODUCTION_URL en CRON_SECRET correct zijn ingesteld als GitHub Secrets.',
      'Verifieer de Vercel-logs van het bijbehorende /api/cron/... endpoint.',
      'Als de fout aanhoudt: controleer of de Supabase-verbinding nog werkt (service_role key).',
    ],
  },
  analysis_error: {
    diagnose: 'Een of meer DBA-analyses mislukken herhaaldelijk voor dezelfde gebruiker.',
    steps: [
      'Bekijk de Anthropic API-status op status.anthropic.com.',
      'Controleer Sentry op recente exceptions rondom /api/dba/analyse.',
      'Verifieer dat ANTHROPIC_API_KEY in Vercel nog geldig is.',
      'Kijk of de gebruiker valide invoer aanlevert (min. 800 tekens, geen binaire data).',
    ],
  },
  webhook_error: {
    diagnose: 'Een Stripe-webhook is niet succesvol verwerkt of de signature-validatie is mislukt.',
    steps: [
      'Open het Stripe-dashboard → Developers → Webhooks → Recent deliveries.',
      'Verifieer dat STRIPE_WEBHOOK_SECRET in Vercel overeenkomt met het actieve eindpunt (whsec_...).',
      'Controleer Vercel-logs van /api/billing/webhook op 400-foutmeldingen.',
      'Bij "No signatures found matching": webhook secret is out-of-sync, roteer via Stripe.',
    ],
  },
  referral_error: {
    diagnose: 'Een fout in de referral-logica: bijv. dubbele credits, ongeldige code of mislukte conversie.',
    steps: [
      'Bekijk de referrals-tabel in Supabase Studio op dubbele of ongeldige rijen.',
      'Controleer de Vercel-logs van /api/referral/... op stacktraces.',
      'Verifieer of de betrokken gebruiker (zie metadata.user_id) een geldige referral-code heeft.',
    ],
  },
  admin_promoted: {
    diagnose: 'Een gebruiker is handmatig gepromoveerd tot admin via de database of een Postgres-trigger.',
    steps: [
      'Verifieer in Supabase → profiles tabel of de promotie opzettelijk was.',
      'Als de promotie onverwacht was: zet role terug naar "user" via Supabase Studio.',
      'Controleer wie de wijziging heeft doorgevoerd (Supabase audit log of git history).',
    ],
  },
  general: {
    diagnose: 'Een algemene systeemmelding. Bekijk de metadata voor specifieke context.',
    steps: [
      'Controleer de metadata in de tabel hieronder voor details over de trigger.',
      'Als het om quota-misbruik gaat: open Gebruikersbeheer en bekijk het gebruikersprofiel.',
      'Overweeg tijdelijk de gebruiker te blokkeren als er aantoonbaar misbruik is.',
    ],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetadataTable({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (entries.length === 0) return null
  return (
    <table className="w-full text-xs border-collapse">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-b border-border/40 last:border-0">
            <td className="py-1.5 pr-4 font-medium text-muted-foreground w-36 align-top">{k}</td>
            <td className="py-1.5 font-mono text-foreground/80 break-all">{String(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FixAdvice({ type }: { type: string }) {
  const advice = FIX_ADVICE[type] ?? FIX_ADVICE['general']
  return (
    <div className="rounded-lg bg-muted/50 border border-border/60 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oplossingsadvies</p>
      <p className="text-sm text-foreground/80">{advice.diagnose}</p>
      <ol className="space-y-1.5 text-sm text-foreground/70 list-decimal list-inside">
        {advice.steps.map((step, i) => (
          <li key={i} className="leading-snug">{step}</li>
        ))}
      </ol>
    </div>
  )
}

function AlertCard({
  alert,
  onResolve,
  resolving,
}: {
  alert: Alert
  onResolve: (id: string) => void
  resolving: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[alert.severity]
  const Icon = cfg.icon
  const hasMetadata = Object.keys(alert.metadata ?? {}).length > 0

  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${cfg.headerBg} px-5 py-4 flex items-start gap-3`}>
        <Icon className={`size-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-card border border-border text-muted-foreground font-medium">
              {TYPE_LABELS[alert.type] ?? alert.type}
            </span>
            {alert.email_sent ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                <MailCheck className="size-3" /> Mail verstuurd
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mail className="size-3" /> Geen mail
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(alert.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!alert.resolved && (
            <Button
              variant="outline"
              size="sm"
              disabled={resolving === alert.id}
              onClick={() => onResolve(alert.id)}
              className="gap-1.5 text-xs h-8"
            >
              {resolving === alert.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle className="size-3.5" />
              )}
              Opgelost
            </Button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-white/60 hover:text-foreground transition-colors"
            title={expanded ? 'Inklappen' : 'Details tonen'}
          >
            {expanded
              ? <ChevronDown className="size-4" />
              : <ChevronRight className="size-4" />
            }
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 py-4 space-y-4 bg-card border-t border-border/50">
          <p className="text-sm text-foreground/80 leading-relaxed">{alert.message}</p>

          {hasMetadata && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Metadata</p>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <MetadataTable metadata={alert.metadata} />
              </div>
            </div>
          )}

          <FixAdvice type={alert.type} />

          {alert.resolved && alert.resolved_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-emerald-500" />
              Opgelost op {formatDate(alert.resolved_at)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hoofd pagina ───────────────────────────────────────────────────────────────

const STATUS_TABS: { key: AlertStatus; label: string }[] = [
  { key: 'open',     label: 'Openstaand' },
  { key: 'resolved', label: 'Opgelost' },
  { key: 'all',      label: 'Alles' },
]

const SEVERITY_FILTERS: { key: string; label: string }[] = [
  { key: '',         label: 'Alle ernst' },
  { key: 'critical', label: 'Kritiek' },
  { key: 'warning',  label: 'Waarschuwing' },
  { key: 'info',     label: 'Info' },
]

export default function AdminAlertsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [fetching, setFetching] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [statusTab, setStatusTab] = useState<AlertStatus>('open')
  const [severityFilter, setSeverityFilter] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user && !isAdmin) router.push('/dashboard')
  }, [user, loading, isAdmin, router])

  const fetchAlerts = useCallback(async () => {
    setFetching(true)
    try {
      const params = new URLSearchParams({ status: statusTab })
      if (severityFilter) params.set('severity', severityFilter)
      const res = await fetch(`/api/admin/alerts?${params}`)
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    } catch {
      setAlerts([])
    } finally {
      setFetching(false)
    }
  }, [statusTab, severityFilter])

  useEffect(() => {
    if (!loading && isAdmin) fetchAlerts()
  }, [loading, isAdmin, fetchAlerts])

  async function handleResolve(alertId: string) {
    setResolving(alertId)
    try {
      await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch {
      // stil falen — geen actie
    } finally {
      setResolving(null)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) return null

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length

  return (
    <div className="space-y-6">

      {/* Terug + header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Control Tower
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meldingen</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Systeemmeldingen, fouten en kritieke events — met oplossingsadvies per melding.
            </p>
          </div>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 shrink-0">
              <XCircle className="size-4" />
              {criticalCount} kritiek
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                statusTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {SEVERITY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key)}
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                severityFilter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchAlerts}
          disabled={fetching}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${fetching ? 'animate-spin' : ''}`} />
          Verversen
        </button>
      </div>

      {/* Lijst */}
      {fetching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="size-4 rounded-full bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <CheckCircle className="size-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground">
            {statusTab === 'open' ? 'Geen openstaande meldingen' : 'Geen meldingen gevonden'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusTab === 'open'
              ? 'Alles ziet er goed uit. Nieuwe meldingen verschijnen hier zodra het systeem ze detecteert.'
              : 'Probeer een andere filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={handleResolve}
              resolving={resolving}
            />
          ))}
          <p className="text-xs text-muted-foreground text-right pt-1">
            {alerts.length} melding{alerts.length !== 1 ? 'en' : ''} getoond
          </p>
        </div>
      )}
    </div>
  )
}
