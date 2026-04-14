import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

type PurchasePlan = 'one_time' | 'monthly' | 'yearly'

function buildPurchaseWelcomeHtml(plan: PurchasePlan): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl'
  const dashboardUrl = `${appUrl}/dashboard`
  const logoUrl = `${appUrl}/logo-white-v3-full.png`

  const content: Record<PurchasePlan, { heading: string; body1: string; body2: string; cta: string }> = {
    one_time: {
      heading: 'Je DBA-check staat klaar',
      body1: 'Welkom bij DBA Kompas. Je analyse-krediet is geactiveerd en je kunt direct aan de slag.',
      body2: 'Plak je opdrachtomschrijving in het analyseveld en ontvang een indicatief overzicht van mogelijke DBA-aandachtspunten. Zo krijg je snel een beeld van waar je op kunt letten.',
      cta: 'Ga naar je dashboard',
    },
    monthly: {
      heading: 'Welkom bij DBA Kompas',
      body1: 'Je maandabonnement is actief.',
      body2: 'Je hebt toegang tot DBA-analyses en blijft op de hoogte via actuele nieuwsberichten over arbeidsrelaties. Ga naar je dashboard en analyseer je eerste opdrachtomschrijving.',
      cta: 'Ga naar je dashboard',
    },
    yearly: {
      heading: 'Welkom bij DBA Kompas',
      body1: 'Je jaarabonnement is actief.',
      body2: 'Een vol jaar toegang tot DBA-analyses en het laatste nieuws over arbeidsrelaties. Ga naar je dashboard en analyseer je eerste opdrachtomschrijving.',
      cta: 'Ga naar je dashboard',
    },
  }

  const { heading, body1, body2, cta } = content[plan]

  return `
<div style="width: 100%; background-color: #1a2332; margin: 0; padding: 0;">
  <div style="max-width: 580px; margin: 0 auto; padding: 60px 24px;">
    <div style="margin-bottom: 52px;">
      <img src="${logoUrl}" alt="DBA Kompas" width="200" style="display: block; height: auto; border: 0;" />
    </div>
    <p style="color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 24px 0;">${heading}</p>
    <p style="color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 17px; line-height: 1.75; margin: 0 0 16px 0;">${body1}</p>
    <p style="color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 17px; line-height: 1.75; margin: 0 0 40px 0;">${body2}</p>
    <div style="margin-bottom: 52px;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #d4782a; color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; letter-spacing: 0.01em;">${cta}</a>
    </div>
    <hr style="border: none; border-top: 1px solid #2e3f55; margin: 0 0 40px 0;" />
    <p style="color: #ffffff; font-family: 'Rethink Sans', sans-serif; font-size: 15px; line-height: 1.75; margin: 0;">Met vriendelijke groet,<br>Het DBA Kompas team</p>
  </div>
</div>
  `.trim()
}

export async function sendPurchaseWelcomeEmail(to: string, plan: PurchasePlan) {
  const subjects: Record<PurchasePlan, string> = {
    one_time: 'DBA Kompas — Je check staat klaar',
    monthly:  'DBA Kompas — Je maandabonnement is actief',
    yearly:   'DBA Kompas — Je jaarabonnement is actief',
  }

  return client.sendEmail({
    From: 'DBA Kompas <noreply@dbakompas.nl>',
    To: to,
    Subject: subjects[plan],
    HtmlBody: buildPurchaseWelcomeHtml(plan),
    MessageStream: 'outbound',
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
  return client.sendEmail({
    From: 'DBA Kompas <noreply@dbakompas.nl>',
    To: to,
    Subject: subject,
    HtmlBody: html,
    MessageStream: 'outbound',
  })
}
