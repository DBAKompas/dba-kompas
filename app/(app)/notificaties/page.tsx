'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  BellOff,
  Check,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

function getNotificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'warning':
      return AlertTriangle
    case 'success':
      return CheckCircle
    default:
      return Info
  }
}

export default function NotificatiesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : data.notifications || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id: string) => {
    setMarkingRead((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
      }
    } finally {
      setMarkingRead((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Notificaties</h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Meldingen over uw analyses en DBA-updates
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <BellOff className="mx-auto size-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">Geen notificaties</p>
          <p className="mt-1 text-sm text-muted-foreground">
            U ontvangt hier meldingen over uw analyses en belangrijke updates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            return (
              <div
                key={notification.id}
                className={`rounded-xl border border-border bg-card px-5 py-4 transition-opacity ${notification.is_read ? 'opacity-55' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.is_read && (
                          <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      {notification.created_at && (
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {new Date(notification.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={markingRead.has(notification.id)}
                      onClick={() => markAsRead(notification.id)}
                      className="shrink-0"
                    >
                      {markingRead.has(notification.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Gelezen
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
