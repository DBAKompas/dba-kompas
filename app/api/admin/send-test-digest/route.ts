import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWeeklyDigest } from '@/lib/email'

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role === 'admin'
}

const SAMPLE_DATA = {
  newsItems: [
    {
      title: 'Nieuwe handhavingsrichtsnoeren gepubliceerd',
      summary: 'De Belastingdienst heeft vernieuwde richtsnoeren gepubliceerd over de handhaving van arbeidsrelaties. Dit heeft directe gevolgen voor opdrachtomschrijvingen in de IT-sector.',
      impact: 'hoog',
      category: 'Wetgeving',
    },
    {
      title: 'Rechtbank Utrecht: schijnzelfstandigheid vastgesteld',
      summary: 'Een ZZP-er werd na rechterlijke uitspraak als werknemer aangemerkt. De opdrachtomschrijving bleek onvoldoende zelfstandigheid te reflecteren.',
      impact: 'middel',
      category: 'Jurisprudentie',
    },
    {
      title: 'Belastingdienst start nieuwe controlerondes Q2 2026',
      summary: 'Vanaf april worden nieuwe sectoren aan een DBA-check onderworpen. Zorg dat uw opdrachtomschrijving up-to-date is.',
      impact: 'middel',
      category: 'Beleid',
    },
    {
      title: 'Aanpassing modelovereenkomsten per 1 mei 2026',
      summary: 'De FNV en VNO-NCW hebben nieuwe modelovereenkomsten gepresenteerd die aansluiten bij de gewijzigde wetgeving.',
      impact: 'laag',
      category: 'Wetgeving',
    },
    {
      title: 'UWV publiceert nieuwe richtlijnen gezagsverhouding',
      summary: 'Het UWV verduidelijkt hoe de gezagsverhouding wordt beoordeeld bij tussenkomstconstructies.',
      impact: 'laag',
      category: 'Beleid',
    },
  ],
  documentsSummary: { processed: 4, compliant: 3, warnings: 1 },
  notifications: [],
  userProfile: { name: 'Marvin' },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 401 })
  }

  try {
    await sendWeeklyDigest(user.email!, SAMPLE_DATA)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/send-test-digest] fout:', error)
    return NextResponse.json({ error: 'Verzenden mislukt' }, { status: 500 })
  }
}
