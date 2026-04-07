import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAssessmentPDF } from '@/lib/pdf/generate'

export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    // Map snake_case DB columns to the camelCase interface expected by generateAssessmentPDF
    const pdfInput = {
      id: assessment.id,
      inputText: assessment.input_text,
      overallRiskLabel: assessment.overall_risk_label,
      overallSummary: assessment.overall_summary,
      compactAssignmentDraft: typeof assessment.compact_assignment_draft === 'string'
        ? assessment.compact_assignment_draft
        : JSON.stringify(assessment.compact_assignment_draft),
      optimizedBrief: typeof assessment.optimized_brief === 'string'
        ? assessment.optimized_brief
        : JSON.stringify(assessment.optimized_brief),
      domains: assessment.domains,
      engagementDurationModule: assessment.engagement_duration_module,
      createdAt: assessment.created_at,
    }

    const doc = generateAssessmentPDF(pdfInput)

    // Collect PDF into buffer
    const chunks: Uint8Array[] = []
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      doc.end()
    })

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dba-analyse-${id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
