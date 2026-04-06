import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">DBA Kompas</h1>
        <p className="text-gray-600 mb-8">Ingelogd als {user.email}</p>
        <div className="grid gap-4">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Wet DBA Analyse</h2>
            <p className="text-gray-600 mb-4">Controleer of jouw opdrachtrelatie voldoet aan de Wet DBA.</p>
            <a href="/dashboard/analyse" className="inline-block bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Start analyse</a>
          </div>
        </div>
      </div>
    </main>
  )
}
