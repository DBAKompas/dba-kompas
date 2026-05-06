import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BrandLogo from '@/components/marketing/BrandLogo'

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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo variant="dark" className="h-10 w-auto" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Welkom {firstName}!</h1>
          <p className="text-sm text-slate-600 mb-6">
            Gelukt, je kunt nu gelijk beginnen.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5"
          >
            Naar mijn dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
