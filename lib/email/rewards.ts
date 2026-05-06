/**
 * E-mail templates voor reward verloop.
 *
 * Dark navy huisstijl (#0b1d3a) met oranje accent (#f97316),
 * conform DBA Kompas welkomstmail. Inline CSS voor e-mailclient compat.
 */

import { sendEmail } from '@/modules/email/send'

export type RewardType = 'free_check' | 'month_discount' | 'two_month_discount'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl').replace(/\/+$/, '')

const REWARD_LABEL: Record<RewardType, string> = {
  free_check:         'gratis DBA-analyse',
  month_discount:     '1 maand gratis abonnement',
  two_month_discount: '2 maanden gratis abonnement',
}

const REWARD_CTA_PATH: Record<RewardType, string> = {
  free_check:         '/dashboard',
  month_discount:     '/dashboard/billing',
  two_month_discount: '/dashboard/billing',
}

const REWARD_CTA_LABEL: Record<RewardType, string> = {
  free_check:         'Start mijn gratis analyse',
  month_discount:     'Wissel mijn maand korting in',
  two_month_discount: 'Wissel mijn 2 maanden korting in',
}

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0b1d3a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e6ecf5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b1d3a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#102a4d;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #1d3b66;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">DBA Kompas</div>
              <div style="font-size:13px;color:#9bb0d1;margin-top:2px;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-size:15px;line-height:1.6;color:#e6ecf5;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px 32px;border-top:1px solid #1d3b66;font-size:12px;color:#7a90b3;">
              Deze mail is verstuurd door DBA Kompas. Vragen? Antwoord gewoon op deze mail.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="background:#f97316;border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">${label}</a>
    </td></tr>
  </table>`
}

// ── Reminder ─────────────────────────────────────────────────────────────────

export function reminderEmailHtml(rewardType: RewardType, daysLeft: number): string {
  const label = REWARD_LABEL[rewardType]
  const cta = `${APP_URL}${REWARD_CTA_PATH[rewardType]}`
  const days = Math.max(1, Math.round(daysLeft))
  const body = `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#ffffff;">Je beloning verloopt binnenkort</h2>
    <p style="margin:0 0 12px 0;">Je hebt nog <strong style="color:#f97316;">${days} ${days === 1 ? 'dag' : 'dagen'}</strong> om je beloning te gebruiken: <strong>${label}</strong>.</p>
    <p style="margin:0 0 8px 0;">Je verdiende deze beloning omdat één van je deelcodes succesvol werd gebruikt. Bedankt dat je DBA Kompas deelt!</p>
    ${ctaButton(cta, REWARD_CTA_LABEL[rewardType])}
    <p style="margin:0;font-size:13px;color:#9bb0d1;">Wacht je te lang? Dan vervalt deze beloning automatisch.</p>
  `
  return shell('Beloning verloopt binnenkort', body)
}

export async function sendRewardReminderEmail(params: {
  to: string
  rewardType: RewardType
  daysLeft: number
}) {
  const subject = params.daysLeft <= 1
    ? 'Laatste kans: je beloning verloopt morgen'
    : `Nog ${Math.round(params.daysLeft)} dagen om je beloning te gebruiken`
  return sendEmail({
    to: params.to,
    subject,
    html: reminderEmailHtml(params.rewardType, params.daysLeft),
  })
}

// ── Expiry ───────────────────────────────────────────────────────────────────

export function expiryEmailHtml(rewardType: RewardType): string {
  const label = REWARD_LABEL[rewardType]
  const cta = `${APP_URL}/dashboard/beloningen`
  const body = `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#ffffff;">Je beloning is verlopen</h2>
    <p style="margin:0 0 12px 0;">Helaas is je beloning <strong>${label}</strong> verlopen omdat de geldigheidsduur is overschreden.</p>
    <p style="margin:0 0 8px 0;">Geen zorgen: nieuwe deelcodes leveren weer nieuwe mijlpalen op. Deel een code en wie weet verdien je je volgende beloning binnen no time.</p>
    ${ctaButton(cta, 'Bekijk mijn deelcodes')}
  `
  return shell('Beloning verlopen', body)
}

export async function sendRewardExpiredEmail(params: {
  to: string
  rewardType: RewardType
}) {
  return sendEmail({
    to: params.to,
    subject: 'Je beloning is verlopen',
    html: expiryEmailHtml(params.rewardType),
  })
}
