/**
 * /auth/welcome/<token> — magic-link click-through (KI-020-A).
 *
 * Alternatief voor /auth/activate/<token>: wie geen wachtwoord wil
 * instellen klikt hier en wordt via een verse, server-gegenereerde
 * Supabase-magic-link ingelogd. Gmail's SafeBrowsing kan deze pagina
 * prefetchen zonder effect: pas bij de POST (knop-klik) wordt de
 * magic-link überhaupt gegenereerd.
 */

import Link from 'next/link'
import { Mail } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import { validateWelcomeToken } from '@/lib/auth/welcome-token-server'
import { WelcomeForm } from './WelcomeForm'

type PageParams = Promise<{ token: string }>

function TokenProblemCard({ headline, body }: { headline: string; body: string }) {
  return (
    <div className="glass-card p-8 space-y-5 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">{headline}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      <Link
        href="/login"
        className="inline-flex h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold items-center justify-center hover:bg-accent transition-colors"
      >
        Vraag nieuwe inloglink aan
      </Link>
    </div>
  )
}

export default async function WelcomePage({ params }: { params: PageParams }) {
  const { token } = await params
  const state = await validateWelcomeToken(token)

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 hero-gradient">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="inline-flex justify-center w-full">
          <BrandLogo variant="dark" className="h-10 w-auto" />
        </Link>

        {!state.ok ? (
          state.reason === 'used' ? (
            <TokenProblemCard
              headline="Link is al gebruikt"
              body="Deze inloglink is al eerder gebruikt. Log in met je e-mailadres, of vraag een nieuwe inloglink aan."
            />
          ) : state.reason === 'expired' ? (
            <TokenProblemCard
              headline="Link is verlopen"
              body="Deze inloglink is niet meer geldig. Vraag een nieuwe inloglink aan via het inlogscherm."
            />
          ) : (
            <TokenProblemCard
              headline="Link is niet geldig"
              body="We konden deze inloglink niet valideren. Vraag een nieuwe inloglink aan via het inlogscherm."
            />
          )
        ) : (
          <div className="glass-card p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Klaar om in te loggen
            </h1>
            <p className="text-sm text-muted-foreground">
              Klik op de knop om direct in te loggen als{' '}
              <strong className="text-foreground">{state.payload.email}</strong>.
            </p>

            <WelcomeForm token={token} />

            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              Liever een wachtwoord instellen voor later?{' '}
              <Link
                href={`/auth/activate/${token}`}
                className="text-accent hover:underline font-medium"
              >
                Activeer mijn account
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Vragen? Mail{' '}
          <a href="mailto:support@dbakompas.nl" className="text-accent hover:underline">
            support@dbakompas.nl
          </a>
        </p>
      </div>
    </main>
  )
}
