import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Welkom bij DBA Kompas',
  robots: 'noindex, nofollow',
}

export default async function WelkomBedanktPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/inloggen')
  }
  const meta = (user.user_metadata ?? {}) as { first_name?: string }
  const firstName = meta.first_name?.trim() || 'er'
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">Welkom {firstName}!</h1>
        <p className="text-sm text-slate-600 mb-6">
          Je account staat klaar en je gratis DBA Check is gekoppeld. Klik hieronder om direct te starten.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5"
        >
          Naar mijn dashboard
        </Link>
      </div>
    </main>
  )
}
