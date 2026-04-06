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
