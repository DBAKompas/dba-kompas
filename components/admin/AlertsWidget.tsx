'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Info, XCircle, CheckCircle, Loader2 } from 'lucide-react'

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  metadata: Record<string, unknown>
  email_sent: boolean
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  })
}

const SEVERITY_STYLES = {
  critical: {
    border: 'border-red-300 bg-red-50',
    icon: XCircle,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    label: 'Kritiek',
  },
  warning: {
    border: 'border-amber-300 bg-amber-50',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Waarschuwing',
  },
  info: {
    border: 'border-blue-200 bg-blue-50',
    icon: Info,
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Info',
  },
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/alerts')
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    } catch {
      // stil falen — widget toont niets als API onbereikbaar is
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

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
      // stil falen
    } finally {
      setResolving(null)
    }
  }

  if (loading || alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Openstaande meldingen ({alerts.length})
      </p>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity]
          const Icon = style.icon
          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 flex items-start gap-3 ${style.border}`}
            >
              <Icon className={`size-4 mt-0.5 shrink-0 ${style.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(alert.created_at)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
              </div>
              <button
                onClick={() => handleResolve(alert.id)}
                disabled={resolving === alert.id}
                className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors disabled:opacity-50"
                title="Markeer als opgelost"
              >
                {resolving === alert.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="size-3.5" />
                )}
                Oplossen
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
