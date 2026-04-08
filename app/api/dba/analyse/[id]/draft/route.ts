import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAssignmentDraft } from '@/lib/ai'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Parse mode from query string — default to compact for speed
    const url = new URL(request.url)
    const rawMode = url.searchParams.get('mode')
    const mode: 'compact' | 'full' = rawMode === 'full' ? 'full' : 'compact'

    // Fetch the assessment to get the original input and analysis data
    const { data: assessment, error: fetchError } = await supabaseAdmin
      .from('dba_assessments')
      .select('id, user_id, input_text, overall_risk_label, directional_assessment, top_improvements, ai_analysis')
      .eq('id', id)
      .single()

    if (fetchError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Only allow the owner to generate drafts
    if (assessment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const directionalAssessment = assessment.directional_assessment as { typeHint?: string } | null
    const simulationFactState = (assessment.ai_analysis as { simulationFactState?: Record<string, unknown> } | null)?.simulationFactState ?? {}

    const draft = await generateAssignmentDraft(
      assessment.input_text,
      {
        overallRiskLabel: assessment.overall_risk_label ?? 'midden',
        typeHint: directionalAssessment?.typeHint ?? 'projectmatige zelfstandige',
        topImprovements: (assessment.top_improvements as string[]) ?? [],
        simulationFactState,
      },
      mode
    )

    // Only update the DB fields relevant for the requested mode
    if (mode === 'compact') {
      const { error: updateError } = await supabaseAdmin
        .from('dba_assessments')
        .update({
          compact_assignment_draft: JSON.stringify(draft.compactAssignmentDraft),
        })
        .eq('id', id)

      if (updateError) {
        console.error('[DBA] Failed to save compact draft:', updateError)
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
      }

      return NextResponse.json({
        compact_assignment_draft: JSON.stringify(draft.compactAssignmentDraft),
      })
    } else {
      const { error: updateError } = await supabaseAdmin
        .from('dba_assessments')
        .update({
          optimized_brief: JSON.stringify(draft.longAssignmentDraft),
          reusable_building_blocks: draft.reusableBuildingBlocks,
          additional_improvements: draft.additionalImprovements,
          follow_up_questions: draft.followUpQuestions,
        })
        .eq('id', id)

      if (updateError) {
        console.error('[DBA] Failed to save full draft:', updateError)
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
      }

      return NextResponse.json({
        optimized_brief: JSON.stringify(draft.longAssignmentDraft),
        reusable_building_blocks: draft.reusableBuildingBlocks,
        additional_improvements: draft.additionalImprovements,
        follow_up_questions: draft.followUpQuestions,
      })
    }
  } catch (error) {
    console.error('Draft generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
