'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Save,
  Loader2,
  CreditCard,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'

interface Profile {
  name: string
  email: string
  bedrijfstak: string
  specialisatie: string
  nieuws_voorkeuren: {
    wetgeving: boolean
    jurisprudentie: boolean
    beleid: boolean
  }
  notificatie_instellingen: {
    email: boolean
    push: boolean
    nieuwsUpdates: boolean
    analyseResultaten: boolean
  }
  subscription?: {
    status: string
    plan: string
  }
}

const bedrijfstakOpties = [
  'ICT / Software',
  'Bouw',
  'Zorg',
  'Transport & Logistiek',
  'Financiële dienstverlening',
  'Juridisch',
  'Overheid',
  'Onderwijs',
  'Anders',
]

const specialisatieOpties = [
  'Arbeidsrecht',
  'Belastingrecht',
  'Contractrecht',
  'HR / Personeelszaken',
  'Management / Directie',
  'Financiën / Administratie',
  'Anders',
]

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted-foreground/25'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function ProfielPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          bedrijfstak: profile.bedrijfstak,
          specialisatie: profile.specialisatie,
          nieuws_voorkeuren: profile.nieuws_voorkeuren,
          notificatie_instellingen: profile.notificatie_instellingen,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const toggleNieuwsVoorkeur = (key: keyof Profile['nieuws_voorkeuren']) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nieuws_voorkeuren: {
              ...prev.nieuws_voorkeuren,
              [key]: !prev.nieuws_voorkeuren?.[key],
            },
          }
        : prev
    )
  }

  const toggleNotificatie = (key: keyof Profile['notificatie_instellingen']) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            notificatie_instellingen: {
              ...prev.notificatie_instellingen,
              [key]: !prev.notificatie_instellingen?.[key],
            },
          }
        : prev
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground">
        Profiel kon niet worden geladen.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profiel</h1>
        <p className="text-sm text-muted-foreground mt-1">Beheer uw accountinstellingen</p>
      </div>

      {/* Persoonlijke gegevens */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Persoonlijke gegevens</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              value={profile.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrijfstak">Bedrijfstak</Label>
            <select
              id="bedrijfstak"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={profile.bedrijfstak || ''}
              onChange={(e) => updateField('bedrijfstak', e.target.value)}
            >
              <option value="">Selecteer bedrijfstak</option>
              {bedrijfstakOpties.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialisatie">Specialisatie</Label>
            <select
              id="specialisatie"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={profile.specialisatie || ''}
              onChange={(e) => updateField('specialisatie', e.target.value)}
            >
              <option value="">Selecteer specialisatie</option>
              {specialisatieOpties.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nieuws voorkeuren */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Nieuws voorkeuren</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kies welke nieuwscategorieën u wilt ontvangen
          </p>
        </div>
        <div className="space-y-2">
          {[
            { key: 'wetgeving' as const, label: 'Wetgeving' },
            { key: 'jurisprudentie' as const, label: 'Jurisprudentie' },
            { key: 'beleid' as const, label: 'Beleid' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleNieuwsVoorkeur(item.key)}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Toggle
                checked={profile.nieuws_voorkeuren?.[item.key] ?? false}
                onChange={() => toggleNieuwsVoorkeur(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notificatie instellingen */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notificatie instellingen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Beheer hoe u notificaties ontvangt
          </p>
        </div>
        <div className="space-y-2">
          {[
            { key: 'email' as const, label: 'E-mail notificaties' },
            { key: 'push' as const, label: 'Push notificaties' },
            { key: 'nieuwsUpdates' as const, label: 'Nieuws updates' },
            { key: 'analyseResultaten' as const, label: 'Analyse resultaten' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => toggleNotificatie(item.key)}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Toggle
                checked={profile.notificatie_instellingen?.[item.key] ?? false}
                onChange={() => toggleNotificatie(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Abonnement */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Abonnement</h2>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {profile.subscription?.plan || 'Geen actief abonnement'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status:{' '}
              <span className="font-medium">
                {profile.subscription?.status || 'Inactief'}
              </span>
            </p>
          </div>
          {profile.subscription?.status === 'active' && (
            <CheckCircle className="size-5 text-emerald-500" />
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleManageSubscription}
          disabled={portalLoading}
        >
          {portalLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          Abonnement beheren
        </Button>
      </div>

      {/* Opslaan */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Opslaan
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle className="size-4" />
            Opgeslagen
          </span>
        )}
      </div>
    </div>
  )
}
