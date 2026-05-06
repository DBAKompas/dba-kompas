import { WelcomeForm } from './WelcomeForm'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Activeer je gratis DBA Check',
  robots: 'noindex, nofollow',
}

type Props = { params: Promise<{ token: string }> }

export default async function WelcomeLinkPage({ params }: Props) {
  const { token } = await params
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Activeer je gratis DBA Check
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Vul hieronder je gegevens in en wij maken direct een account aan met daarin je gratis check.
        </p>
        <WelcomeForm token={token} />
      </div>
    </main>
  )
}
