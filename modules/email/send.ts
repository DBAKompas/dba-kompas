import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type PurchasePlan = 'one_time' | 'monthly' | 'yearly'

function buildPurchaseWelcomeHtml(plan: PurchasePlan): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl'
  const dashboardUrl = `${appUrl}/dashboard`
  const logoUrl = `${appUrl}/logo-white-v3-full.png`

  const content: Record<PurchasePlan, { heading: string; body: string; cta: string }> = {
    one_time: {
      heading: 'Je DBA-check is geactiveerd',
      body: 'Bedankt voor je aankoop. Je eenmalige DBA-check staat klaar. Plak je opdrachtomschrijving in het analyseveld en krijg direct inzicht in je DBA-risico\'s.',
      cta: 'Ga naar je dashboard',
    },
    monthly: {
      heading: 'Welkom bij DBA Kompas Pro',
      body: 'Je maandabonnement is actief. Je hebt nu onbeperkt toegang tot alle DBA-analyses, gidsen en het laatste nieuws over DBA-wetgeving. Analyseer zoveel opdrachten als je wilt.',
      cta: 'Ga naar je dashboard',
    },
    yearly: {
      heading: 'Welkom bij DBA Kompas Pro',
      body: 'Je jaarabonnement is actief. Je hebt een vol jaar onbeperkt toegang tot alle DBA-analyses, gidsen en het laatste nieuws over DBA-wetgeving. Analyseer zoveel opdrachten als je wilt.',
      cta: 'Ga naar je dashboard',
    },
  }

  const { heading, body, cta } = content[plan]

  return `
<div style="font-family: 'Rethink Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #1a2332; padding: 60px 24px; min-height: 100vh; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto;">

    <div style="margin-bottom: 52px;">
      <img src="${logoUrl}" alt="DBA Kompas" width="200" style="display: block; height: auto; border: 0;" />
    </div>

    <p style="color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 24px 0;">${heading}</p>

    <p style="color: #ffffff; font-size: 17px; line-height: 1.75; margin: 0 0 40px 0;">${body}</p>

    <div style="margin-bottom: 52px;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #d4782a; color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; letter-spacing: 0.01em;">${cta}</a>
    </div>

    <hr style="border: none; border-top: 1px solid #2e3f55; margin: 0 0 40px 0;" />

    <p style="color: #ffffff; font-size: 15px; line-height: 1.75; margin: 0;">
      Met vriendelijke groet,<br>
      Het DBA Kompas team
    </p>

  </div>
</div>
  `.trim()
}

export async function sendPurchaseWelcomeEmail(to: string, plan: PurchasePlan) {
  const templateIds: Record<PurchasePlan, string | undefined> = {
    one_time: process.env.RESEND_TEMPLATE_WELCOME_ONE_TIME,
    monthly:  process.env.RESEND_TEMPLATE_WELCOME_MONTHLY,
    yearly:   process.env.RESEND_TEMPLATE_WELCOME_YEARLY,
  }

  const subjects: Record<PurchasePlan, string> = {
    one_time: 'Je DBA-check is geactiveerd — welkom bij DBA Kompas',
    monthly:  'Welkom bij DBA Kompas Pro — je maandabonnement is actief',
    yearly:   'Welkom bij DBA Kompas Pro — je jaarabonnement is actief',
  }

  const templateId = templateIds[plan]

  // Gebruik Resend template als ID beschikbaar is, anders inline HTML
  if (templateId) {
    return resend.emails.send({
      from: 'DBA Kompas <noreply@dbakompas.nl>',
      to,
      template_id: templateId,
    } as Parameters<typeof resend.emails.send>[0])
  }

  return resend.emails.send({
    from: 'DBA Kompas <noreply@dbakompas.nl>',
    to,
    subject: subjects[plan],
    html: buildPurchaseWelcomeHtml(plan),
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
