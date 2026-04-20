import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

type PurchasePlan = 'one_time' | 'monthly' | 'yearly'

type SendPurchaseWelcomeOptions = {
  /**
   * Magic link voor 1-klik login (KI-020 guest-flow).
   * Wanneer aanwezig wordt deze in het template ingevuld via {{ login_link }}.
   * Zo niet, dan valt de template terug op een gewone dashboard-link
   * (zie Postmark template: `{{ login_link }}` met default naar {{ app_url }}/login).
   */
  magicLink?: string
}

const TEMPLATE_ALIASES: Record<PurchasePlan, string> = {
  one_time: 'welkomstmail-eenmalig',
  monthly:  'welkomstmail-maand',
  yearly:   'welkomstmail-jaar',
}

function defaultLoginLink(): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '')
  return `${appUrl}/login`
}

export async function sendPurchaseWelcomeEmail(
  to: string,
  plan: PurchasePlan,
  options: SendPurchaseWelcomeOptions = {},
) {
  const loginLink = options.magicLink ?? defaultLoginLink()
  return client.sendEmailWithTemplate({
    From: 'DBA Kompas <noreply@dbakompas.nl>',
    To: to,
    TemplateAlias: TEMPLATE_ALIASES[plan],
    TemplateModel: {
      login_link: loginLink,
    },
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
