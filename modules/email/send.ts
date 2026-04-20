import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

type PurchasePlan = 'one_time' | 'monthly' | 'yearly'

type SendPurchaseWelcomeOptions = {
  /**
   * URL naar `/auth/activate/<token>` (KI-020-A).
   * Klant stelt hier een eigen wachtwoord in, komt direct in dashboard.
   * Wordt in Postmark ingevuld als `{{ activate_link }}`.
   */
  activateLink?: string
  /**
   * URL naar `/auth/welcome/<token>` (KI-020-A).
   * Klant wordt via verse magic-link direct ingelogd (geen wachtwoord).
   * Wordt in Postmark ingevuld als `{{ login_link }}`.
   *
   * Fallback: als zowel `activateLink` als `loginLink` ontbreken (bv. bij
   * een reeds bestaande user die nog inlogt via eigen wachtwoord) vullen
   * we `login_link` met de generieke /login pagina zodat het template
   * niet breekt.
   */
  loginLink?: string
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
  const fallback = defaultLoginLink()
  const activateLink = options.activateLink ?? fallback
  const loginLink = options.loginLink ?? fallback
  return client.sendEmailWithTemplate({
    From: 'DBA Kompas <noreply@dbakompas.nl>',
    To: to,
    TemplateAlias: TEMPLATE_ALIASES[plan],
    TemplateModel: {
      activate_link: activateLink,
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
