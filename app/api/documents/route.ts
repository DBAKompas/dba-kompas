import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeDocument } from '@/lib/ai'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Documents list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const filename = file.name
    const fileType = filename.split('.').pop()?.toLowerCase() || 'unknown'
    const fileSize = file.size

    // Extract text content from the file
    const textContent = await file.text()

    // Insert document as processing
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        filename,
        original_content: textContent,
        status: 'processing',
        file_type: fileType,
        file_size: fileSize,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to insert document:', insertError)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }

    // Run AI analysis
    try {
      const analysis = await analyzeDocument(textContent, filename)

      const status = analysis.riskLevel === 'high' ? 'warning'
        : analysis.riskLevel === 'low' ? 'compliant'
        : 'warning'

      await supabaseAdmin
        .from('documents')
        .update({
          status,
          ai_analysis: analysis,
          suggestions: analysis.suggestions.join('\n'),
          processed_content: textContent,
        })
        .eq('id', doc.id)

      return NextResponse.json({ id: doc.id, status, analysis })
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)

      await supabaseAdmin
        .from('documents')
        .update({ status: 'error' })
        .eq('id', doc.id)

      return NextResponse.json({ id: doc.id, status: 'error', error: 'Analysis failed' })
    }
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
