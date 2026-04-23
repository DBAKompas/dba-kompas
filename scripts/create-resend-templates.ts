/**
 * Eenmalig uitvoeren om de DBA Kompas welkomstmail-templates aan te maken in Resend.
 *
 * Gebruik:
 *   RESEND_API_KEY=re_... npx tsx scripts/create-resend-templates.ts
 *
 * Na uitvoering: kopieer de drie template IDs naar je Vercel env vars:
 *   RESEND_TEMPLATE_WELCOME_ONE_TIME
 *   RESEND_TEMPLATE_WELCOME_MONTHLY
 *   RESEND_TEMPLATE_WELCOME_YEARLY
 */

const APP_URL = 'https://dbakompas.nl'
const LOGO_URL = `${APP_URL}/logo-white-v3-full.png`
const DASHBOARD_URL = `${APP_URL}/dashboard`

function buildHtml(heading: string, body: string): string {
  return `
<div style="font-family: 'Rethink Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #1a2332; padding: 60px 24px; min-height: 100vh; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto;">
    <div style="margin-bottom: 52px;"><img src="${LOGO_URL}" alt="DBA Kompas" width="200" style="display: block; height: auto; border: 0;" /></div>
    <p style="color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 24px 0;">${heading}</p>
    <p style="color: #ffffff; font-size: 17px; line-height: 1.75; margin: 0 0 40px 0;">${body}</p>
    <div style="margin-bottom: 52px;"><a href="${DASHBOARD_URL}" style="display: inline-block; background-color: #d4782a; color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; letter-spacing: 0.01em;">Ga naar je dashboard</a></div>
    <hr style="border: none; border-top: 1px solid #2e3f55; margin: 0 0 40px 0;" />
    <p style="color: #ffffff; font-size: 15px; line-height: 1.75; margin: 0;">Met vriendelijke groet,<br>Het DBA Kompas team</p>
  </div>
</div>`.trim()
}

const templates = [
  {
    envVar: 'RESEND_TEMPLATE_WELCOME_ONE_TIME',
    name: 'DBA Kompas - Welkom eenmalige check',
    subject: 'Je DBA-check is geactiveerd - welkom bij DBA Kompas',
    html: buildHtml(
      'Je DBA-check is geactiveerd',
      "Bedankt voor je aankoop. Je eenmalige DBA-check staat klaar. Plak je opdrachtomschrijving in het analyseveld en krijg direct inzicht in je DBA-risico's."
    ),
  },
  {
    envVar: 'RESEND_TEMPLATE_WELCOME_MONTHLY',
    name: 'DBA Kompas - Welkom maandabonnement',
    subject: 'Welkom bij DBA Kompas Pro - je maandabonnement is actief',
    html: buildHtml(
      'Welkom bij DBA Kompas Pro',
      'Je maandabonnement is actief. Je hebt nu toegang tot 20 DBA-checks per maand, alle gidsen en het laatste nieuws over DBA-wetgeving.'
    ),
  },
  {
    envVar: 'RESEND_TEMPLATE_WELCOME_YEARLY',
    name: 'DBA Kompas - Welkom jaarabonnement',
    subject: 'Welkom bij DBA Kompas Pro - je jaarabonnement is actief',
    html: buildHtml(
      'Welkom bij DBA Kompas Pro',
      'Je jaarabonnement is actief. Een vol jaar toegang met tot 25 DBA-checks per maand, alle gidsen en het laatste nieuws over DBA-wetgeving.'
    ),
  },
]

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('Fout: RESEND_API_KEY ontbreekt.')
    console.error('Gebruik: RESEND_API_KEY=re_... npx tsx scripts/create-resend-templates.ts')
    process.exit(1)
  }

  console.log('Templates aanmaken in Resend...\n')

  for (const t of templates) {
    const res = await fetch('https://api.resend.com/emails/templates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: t.name, subject: t.subject, html: t.html }),
    })

    const json = await res.json() as { id?: string; message?: string }

    if (!res.ok || !json.id) {
      console.error(`Mislukt: ${t.name}`)
      console.error(JSON.stringify(json, null, 2))
      continue
    }

    console.log(`✅ ${t.name}`)
    console.log(`   ID: ${json.id}`)
    console.log(`   Vercel env var: ${t.envVar}=${json.id}\n`)
  }

  console.log('Klaar. Voeg de drie env vars toe in Vercel en redeploy.')
}

main().catch(console.error)
