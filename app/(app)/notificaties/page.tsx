'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
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
  read: boolean
  createdAt: string
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

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    setMarkingRead((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Notificaties
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex size-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Meldingen over uw analyses en DBA-updates
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BellOff className="mx-auto size-12 mb-3" />
            <p className="text-lg font-medium">Geen notificaties</p>
            <p className="mt-1 text-sm">
              U ontvangt hier meldingen over uw analyses en belangrijke updates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            return (
              <Card
                key={notification.id}
                className={notification.read ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <span className="size-2 rounded-full bg-blue-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {notification.message}
                        </CardDescription>
                        {notification.createdAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('nl-NL', {
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
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={markingRead.has(notification.id)}
                        onClick={() => markAsRead(notification.id)}
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
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
