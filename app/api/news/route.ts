import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const { data: newsItems, error } = await supabase
      .from('news_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch news:', error)
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
    }

    return NextResponse.json(newsItems)
  } catch (error) {
    console.error('News list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
