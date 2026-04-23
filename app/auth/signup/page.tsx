/**
 * /auth/signup
 *
 * Target van de QuickScan success screen "Ga verder" knop.
 * Stuurt de gebruiker door naar de inlogpagina, die de EmailCheckoutModal
 * bevat voor plan-selectie en account-aanmaak.
 *
 * Server component - geen client-side JS nodig.
 */

import { redirect } from 'next/navigation'

export default function SignupPage() {
  redirect('/login')
}
