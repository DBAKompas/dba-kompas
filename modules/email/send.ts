import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: 'DBA Kompas <noreply@dbakompas.nl>',
    to,
    subject: 'Welkom bij DBA Kompas',
    html: `
      <h1>Welkom, ${name}!</h1>
      <p>Je account is aangemaakt. Je kunt nu inloggen via DBA Kompas.</p>
      <p>Met vriendelijke groet,<br>Het DBA Kompas team</p>
    `,
  })
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: 'DBA Kompas <noreply@dbakompas.nl>',
    to,
    subject,
    html,
  })
}

export async function sendOneTimeUpsellEmail(to: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dba-kompas.vercel.app'
  const upgradeUrl = `${appUrl}/upgrade-to-pro`

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f4f0; padding: 40px 20px; min-height: 100vh;">
  <div style="max-width: 480px; margin: 0 auto;">

    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 22px; font-weight: 800; color: #1a2332; letter-spacing: -0.5px;">
        <span style="color: #d4782a;">DBA</span>Kompas
      </span>
    </div>

    <div style="background: #ffffff; border-radius: 20px; padding: 40px 36px; box-shadow: 0 2px 16px rgba(0,0,0,0.07);">

      <h1 style="font-size: 20px; font-weight: 700; color: #1a2332; margin: 0 0 12px 0; text-align: center;">
        Je eenmalige check is klaar 🎉
      </h1>

      <p style="font-size: 15px; color: #64748b; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
        Bedankt voor je aankoop van de eenmalige DBA-check (€9,95). Je kunt nu inloggen en je analyse starten.
      </p>

      <div style="background: #f0f9f4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
        <p style="font-size: 14px; font-weight: 700; color: #166534; margin: 0 0 6px 0;">
          Exclusief aanbod — eerste maand voor €10,05
        </p>
        <p style="font-size: 14px; color: #15803d; line-height: 1.5; margin: 0;">
          Omdat je al €9,95 hebt betaald voor de eenmalige check, krijg je die korting automatisch op de eerste maand van het maandabonnement. Daarna betaal je gewoon €20/maand.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${upgradeUrl}"
           style="display: inline-block; background-color: #1a2332; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 100px; letter-spacing: 0.1px;">
          Upgrade voor €10,05 eerste maand →
        </a>
      </div>

      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center; margin: 0;">
        Geen interesse? Dan geniet je gewoon van je eenmalige check. Het aanbod blijft beschikbaar via je account.
      </p>

    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
      DBA Kompas &bull; <a href="${appUrl}" style="color: #94a3b8;">dbakompas.nl</a>
    </p>

  </div>
</div>
  `.trim()

  return resend.emails.send({
    from: 'DBA Kompas <noreply@dbakompas.nl>',
    to,
    subject: 'Je DBA-check is klaar — upgrade voor €10,05 eerste maand',
    html,
  })
}
