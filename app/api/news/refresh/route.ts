import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAndStoreNews, isRefreshOnCooldown } from '@/lib/news/fetch'
import { fanOutNotification } from '@/lib/notifications'

// Zowel handmatige POST (door ingelogde gebruiker) als Vercel cron-job (GET)

/**
 * Stuurt een in-app notificatie naar alle actieve gebruikers als er
 * nieuwe nieuwsitems zijn opgeslagen. Fire-and-forget — een notificatiefout
 * blokkeert de refresh-response nooit.
 */
async function notifyUsersIfNewItems(total: number): Promise<void> {
  if (total === 0) return
  const label = total === 1 ? '1 nieuw DBA-nieuws item' : `${total} nieuwe DBA-nieuws items`
  fanOutNotification({
    title: 'Nieuw DBA-nieuws beschikbaar',
    message: `${label} toegevoegd. Bekijk het laatste nieuws over de Wet DBA.`,
    type: 'info',
    relatedItemType: 'news',
  }).catch(err => console.error('[news/refresh] fanOutNotification mislukt:', err))
}

export async function POST(request: Request) {
  // Auth check - alleen ingelogde gebruikers
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const onCooldown = await isRefreshOnCooldown()
  if (onCooldown) {
    return NextResponse.json({
      message: 'Nieuws is recentelijk al bijgewerkt. Probeer over 5 minuten opnieuw.',
      skipped: true,
    })
  }

  try {
    const result = await fetchAndStoreNews()
    notifyUsersIfNewItems(result.total)
    return NextResponse.json({
      success: true,
      newItems: result.total,
      sourcesProcessed: result.sources,
    })
  } catch (err) {
    console.error('[news/refresh] Fout:', err)
    return NextResponse.json({ error: 'Refresh mislukt' }, { status: 500 })
  }
}

// Vercel cron-job roept GET aan (zie vercel.json)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const onCooldown = await isRefreshOnCooldown()
  if (onCooldown) {
    return NextResponse.json({ message: 'Cooldown actief, overgeslagen.', skipped: true })
  }

  try {
    const result = await fetchAndStoreNews()
    notifyUsersIfNewItems(result.total)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[news/refresh cron] Fout:', err)
    return NextResponse.json({ error: 'Cron refresh mislukt' }, { status: 500 })
  }
}
