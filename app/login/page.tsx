'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Ongeldig e-mailadres of wachtwoord.')
      } else {
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (!error) setSent(true)
      else setError('Er ging iets mis. Probeer opnieuw.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Controleer je e-mail</CardTitle>
            <CardDescription>We hebben een inloglink gestuurd naar {email}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Inloggen bij DBA Kompas</CardTitle>
          <CardDescription>
            {mode === 'password' ? 'Log in met je e-mailadres en wachtwoord.' : 'Ontvang een inloglink per e-mail.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" type="email" placeholder="jouw@email.nl" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bezig...' : mode === 'password' ? 'Inloggen' : 'Stuur inloglink'}
            </Button>
            <button type="button" onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError('') }} className="w-full text-sm text-gray-500 hover:underline">
              {mode === 'password' ? 'Liever een magic link?' : 'Liever inloggen met wachtwoord?'}
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
