"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Check } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo variant="dark" className="h-10 w-auto" />
          </Link>
          <div className="glass-card p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Controleer je e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Als er een account bestaat voor <strong className="text-foreground">{email}</strong>, ontvang je een resetlink.
            </p>
          </div>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Terug naar inloggen
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 hero-gradient">
      <div className="w-full max-w-sm space-y-7">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo variant="dark" className="h-10 w-auto" />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Voer je e-mailadres in om je wachtwoord te resetten.</p>
        </div>
        <div className="glass-card rounded-2xl p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">E-mailadres</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="jouw@email.nl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl border border-border bg-background text-sm pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-accent transition-colors disabled:opacity-60"
            >
              {loading ? 'Bezig...' : 'Stuur resetlink'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">← Terug naar inloggen</Link>
        </p>
      </div>
    </main>
  )
}
