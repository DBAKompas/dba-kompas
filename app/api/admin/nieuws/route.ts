import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fanOutNotification } from '@/lib/notifications'

// ─── Auth helper ──────────────────────────────────────────────

async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id }
}

// ─── GET — lijst of enkel bericht ────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const id = req.nextUrl.searchParams.get('id')

  // Enkel bericht ophalen (inclusief volledige content — voor bewerkformulier)
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // Lijst (zonder content veld — voor overzicht)
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10)
  const { data, error } = await supabaseAdmin
    .from('news_items')
    .select('id, title, summary, category, impact, is_new, source, source_url, published_at, created_at')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// ─── POST — nieuw nieuwsbericht aanmaken ─────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { title, summary, content, category, impact, source, source_url, published_at } = body

  if (!title || !summary || !content || !category || !impact) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('news_items')
    .insert({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category: category.trim(),
      impact,
      source: source?.trim() || null,
      source_url: source_url?.trim() || null,
      is_new: true,
      published_at: published_at || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Kon bericht niet opslaan' }, { status: 500 })
  }

  // Fire-and-forget: fan-out notificatie bij hoog-impact nieuws (PROD-003)
  if (impact === 'hoog') {
    fanOutNotification({
      title: 'Nieuw DBA-nieuws met hoge impact',
      message: data.title,
      type: 'info',
      relatedItemId: data.id,
      relatedItemType: 'news_item',
    }).then(({ count }) => {
      console.log(`[notifications] hoog-impact nieuws fan-out: ${count} notificaties aangemaakt`)
    }).catch(err => console.error('[notifications] fan-out mislukt:', err))
  }

  return NextResponse.json(data, { status: 201 })
}

// ─── PATCH — bestaand bericht bijwerken ──────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 })
  }

  const allowedFields = ['title', 'summary', 'content', 'category', 'impact', 'source', 'source_url', 'is_new', 'published_at']
  const sanitized = Object.fromEntries(
    Object.entries(updates)
      .filter(([key]) => allowedFields.includes(key))
      .map(([key, val]) => [key, typeof val === 'string' ? val.trim() : val])
  )

  const { data, error } = await supabaseAdmin
    .from('news_items')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Kon bericht niet bijwerken' }, { status: 500 })
  }

  // Fire-and-forget: fan-out notificatie als impact expliciet naar 'hoog' wordt gezet (PROD-003).
  // We sturen alleen als het update-object 'impact' bevat én de waarde 'hoog' is, zodat
  // herhaaldelijke bewerkingen zonder impact-wijziging geen dubbele notificaties sturen.
  if ('impact' in sanitized && sanitized.impact === 'hoog') {
    fanOutNotification({
      title: 'Nieuw DBA-nieuws met hoge impact',
      message: data.title,
      type: 'info',
      relatedItemId: data.id,
      relatedItemType: 'news_item',
    }).then(({ count }) => {
      console.log(`[notifications] hoog-impact nieuws fan-out (update): ${count} notificaties aangemaakt`)
    }).catch(err => console.error('[notifications] fan-out (update) mislukt:', err))
  }

  return NextResponse.json(data)
}

// ─── DELETE — bericht verwijderen ────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('news_items')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Kon bericht niet verwijderen' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
