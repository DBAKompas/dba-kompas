import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

type PurchasePlan = 'one_time' | 'monthly' | 'yearly'

const TEMPLATE_ALIASES: Record<PurchasePlan, string> = {
  one_time: 'welkomstmail-eenmalig',
  monthly:  'welkomstmail-maand',
  yearly:   'welkomstmail-jaar',
}

export async function sendPurchaseWelcomeEmail(to: string, plan: PurchasePlan) {
  return client.sendEmailWithTemplate({
    From: 'DBA Kompas <noreply@dbakompas.nl>',
    To: to,
    TemplateAlias: TEMPLATE_ALIASES[plan],
    TemplateModel: {},
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
