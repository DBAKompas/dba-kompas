/**
 * /auth/activate/<token> — account-activatiepagina na guest-checkout (KI-020-A).
 *
 * De welkomstmail verwijst naar deze URL (niet naar een rauwe Supabase-
 * magic-link). Gmail's SafeBrowsing-scanner kan deze pagina prefetchen
 * zonder consequenties: het token wordt pas verbruikt wanneer de klant
 * het wachtwoord-formulier daadwerkelijk submit (POST).
 *
 * Bij een ongeldige of verlopen token tonen we een nette foutpagina
 * met een pad naar de magic-link-herstelflow op /login.
 */

import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'
import BrandLogo from '@/components/marketing/BrandLogo'
import { validateWelcomeToken } from '@/lib/auth/welcome-token-server'
import { ActivateForm } from './ActivateForm'

type PageParams = Promise<{ token: string }>

function TokenProblemCard({
  headline,
  body,
}: {
  headline: string
  body: string
}) {
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

export default async function ActivatePage({ params }: { params: PageParams }) {
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
              body="Deze activatielink is al eerder gebruikt. Log in met je e-mailadres en wachtwoord, of vraag een nieuwe inloglink aan."
            />
          ) : state.reason === 'expired' ? (
            <TokenProblemCard
              headline="Link is verlopen"
              body="Deze activatielink is niet meer geldig. Vraag een nieuwe inloglink aan via het inlogscherm."
            />
          ) : (
            <TokenProblemCard
              headline="Link is niet geldig"
              body="We konden deze activatielink niet valideren. Vraag een nieuwe inloglink aan via het inlogscherm."
            />
          )
        ) : (
          <div className="glass-card p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  Stel je wachtwoord in
                </h1>
                <p className="text-xs text-muted-foreground">
                  Zo kun je later inloggen zonder mail.
                </p>
              </div>
            </div>

            <ActivateForm token={token} email={state.payload.email} />

            <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border/40">
              Liever direct inloggen zonder wachtwoord?{' '}
              <Link
                href={`/auth/welcome/${token}`}
                className="text-accent hover:underline font-medium"
              >
                Gebruik de magic link
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
