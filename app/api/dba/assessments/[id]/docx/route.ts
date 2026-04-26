import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAssessmentDocx } from '@/lib/docx/generate'

export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: assessment, error } = await supabase
      .from('dba_assessments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const docxBuffer = await generateAssessmentDocx({
      id:                       assessment.id,
      input_text:               assessment.input_text,
      overall_risk_label:       assessment.overall_risk_label,
      overall_summary:          assessment.overall_summary,
      compact_assignment_draft: typeof assessment.compact_assignment_draft === 'string'
        ? assessment.compact_assignment_draft
        : JSON.stringify(assessment.compact_assignment_draft ?? null),
      optimized_brief:          typeof assessment.optimized_brief === 'string'
        ? assessment.optimized_brief
        : JSON.stringify(assessment.optimized_brief ?? null),
      domains:                  assessment.domains,
      top_improvements:         assessment.top_improvements,
      engagement_duration_module: assessment.engagement_duration_module,
      created_at:               assessment.created_at,
    })

    return new Response(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="dba-analyse-${id.slice(0, 8)}.docx"`,
      },
    })
  } catch (error) {
    console.error('DOCX generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
