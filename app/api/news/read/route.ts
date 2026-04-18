import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/news/read
 * Markeer een nieuwsitem als gelezen voor de ingelogde gebruiker.
 * Slaat op in user_news_read tabel (DB-persistent, niet localStorage).
 *
 * Fix voor verbeterpunt #1: leesgeschiedenis zat alleen in localStorage.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { newsItemId } = await request.json()
  if (!newsItemId) {
    return NextResponse.json({ error: 'newsItemId is verplicht' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_news_read')
    .upsert(
      { user_id: user.id, news_item_id: newsItemId },
      { onConflict: 'user_id,news_item_id' }
    )

  if (error) {
    console.error('[news/read] DB-fout:', error.message)
    return NextResponse.json({ error: 'Kon leesmarkering niet opslaan' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * GET /api/news/read
 * Haal alle gelezen item-IDs op voor de ingelogde gebruiker.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_news_read')
    .select('news_item_id')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Kon leesgeschiedenis niet ophalen' }, { status: 500 })
  }

  return NextResponse.json((data ?? []).map(r => r.news_item_id))
}
