import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeDbaText, type DbaAnalysisResult } from '@/lib/ai'
import { getUserPlan } from '@/modules/billing/entitlements'
import { updateLoopsContact } from '@/lib/loops'
import { captureServerEvent } from '@/lib/posthog'

export const maxDuration = 120

// Rate limits per plan (analyses per 24 uur)
const RATE_LIMITS: Record<string, number> = {
  free: 20,
  pro: 100,
  enterprise: 500,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limiting: tel analyses van afgelopen 24 uur
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabaseAdmin
      .from('dba_assessments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)

    if (!countError) {
      const plan = await getUserPlan()
      const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free
      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: 'Daglimiet bereikt', code: 'rate_limit_exceeded', limit, plan },
          { status: 429 }
        )
      }
    }

    const { inputText, parentAssessmentId } = await request.json()

    if (!inputText || typeof inputText !== 'string') {
      return NextResponse.json({ error: 'inputText is required' }, { status: 400 })
    }

    // PostHog: analyse gestart
    captureServerEvent({
      event: 'analysis_started',
      distinct_id: user.id,
      properties: {
        user_id: user.id,
        account_id: user.id,
        analysis_type: parentAssessmentId ? 'follow_up' : 'new',
        input_method: 'text',
      },
    })

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('bedrijfstak, specialisatie')
      .eq('user_id', user.id)
      .single()

    const result: DbaAnalysisResult = await analyzeDbaText(
      inputText,
      profile?.bedrijfstak,
      profile?.specialisatie
    )

    // If the input was insufficient or needs more info, return directly (geen DB opslag)
    if ('status' in result && (result.status === 'insufficient_input' || result.status === 'needs_more_input')) {
      return NextResponse.json(result)
    }

    // Full analysis result — insert into database
    const analysisResult = result as Record<string, unknown>

    const { data: assessment, error: insertError } = await supabaseAdmin
      .from('dba_assessments')
      .insert({
        user_id: user.id,
        input_text: inputText,
        analysis_status: analysisResult.analysisStatus,
        overall_risk_label: analysisResult.overallRiskLabel,
        overall_risk_color: analysisResult.overallRiskColor,
        overall_summary: analysisResult.overallSummary,
        compact_assignment_draft: analysisResult.compactAssignmentDraft ? JSON.stringify(analysisResult.compactAssignmentDraft) : null,
        optimized_brief: analysisResult.longAssignmentDraft ? JSON.stringify(analysisResult.longAssignmentDraft) : null,
        domains: analysisResult.domains,
        directional_assessment: analysisResult.directionalAssessment,
        top_improvements: analysisResult.topImprovements,
        additional_improvements: analysisResult.additionalImprovements ?? [],
        reusable_building_blocks: analysisResult.reusableBuildingBlocks ?? null,
        simulation_hints: analysisResult.simulationHints ?? [],
        follow_up_questions: analysisResult.followUpQuestions ?? [],
        engagement_duration_module: analysisResult.engagementDurationModule ?? null,
        ai_analysis: {
          simulationFactState: analysisResult.simulationFactState ?? null,
          disclaimerShort: analysisResult.disclaimerShort,
        },
        parent_assessment_id: parentAssessmentId || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to insert assessment:', insertError)
      return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
    }

    // PostHog: analyse voltooid
    captureServerEvent({
      event: 'analysis_completed',
      distinct_id: user.id,
      properties: {
        user_id: user.id,
        account_id: user.id,
        analysis_id: assessment.id,
        analysis_type: parentAssessmentId ? 'follow_up' : 'new',
        risk_label: analysisResult.overallRiskLabel as string | undefined,
        result_category: analysisResult.analysisStatus as string | undefined,
      },
    })

    // Fire-and-forget: Loops contact bijwerken na succesvolle analyse
    if (user.email) {
      supabaseAdmin
        .from('dba_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          updateLoopsContact(user.email!, {
            analysis_completed: true,
            last_analysis_at: new Date().toISOString(),
            analysis_count: count ?? 1,
          }).catch(err => console.error('[LOOPS] analyse tracking error:', err))
        })
        .catch(err => console.error('[LOOPS] analyse count error:', err))
    }

    return NextResponse.json({ id: assessment.id, ...analysisResult })
  } catch (error) {
    console.error('DBA analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
