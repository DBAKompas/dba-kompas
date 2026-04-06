import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: feedback, error } = await supabase
      .from('user_news_feedback')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { newsItemId, isRelevant } = await request.json()

    if (!newsItemId || typeof isRelevant !== 'boolean') {
      return NextResponse.json({ error: 'newsItemId and isRelevant are required' }, { status: 400 })
    }

    const { data: feedback, error } = await supabase
      .from('user_news_feedback')
      .upsert(
        {
          user_id: user.id,
          news_item_id: newsItemId,
          is_relevant: isRelevant,
        },
        { onConflict: 'user_id,news_item_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Failed to submit feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Feedback submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { newsItemId } = await request.json()

    if (!newsItemId) {
      return NextResponse.json({ error: 'newsItemId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_news_feedback')
      .delete()
      .eq('user_id', user.id)
      .eq('news_item_id', newsItemId)

    if (error) {
      console.error('Failed to delete feedback:', error)
      return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
