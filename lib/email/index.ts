import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DEFAULT_FROM = 'DBA Kompas <noreply@dbakompas.nl>';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface DigestData {
  newsItems: any[];
  documentsSummary: {
    processed: number;
    compliant: number;
    warnings: number;
  };
  notifications: any[];
  userProfile: any;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!resend) {
      console.log('[EMAIL] Resend not configured, email skipped');
      return false;
    }

    const emailOptions: Record<string, unknown> = {
      from: DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
    };
    if (params.html) emailOptions.html = params.html;
    if (params.text) emailOptions.text = params.text;
    await resend.emails.send(emailOptions as any);
    console.log('[EMAIL] sent successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL] send error:', error);
    return false;
  }
}

export async function sendWeeklyDigest(userEmail: string, userData: DigestData): Promise<boolean> {
  const subject = `Wekelijkse DBA Kompas Update - ${new Date().toLocaleDateString('nl-NL')}`;
  return sendEmail({
    to: userEmail,
    subject,
    html: generateWeeklyDigestHTML(userData),
    text: generateWeeklyDigestText(userData),
  });
}

export async function sendMonthlyDigest(userEmail: string, userData: DigestData): Promise<boolean> {
  const subject = `Maandelijkse DBA Kompas Samenvatting - ${new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`;
  return sendEmail({
    to: userEmail,
    subject,
    html: generateMonthlyDigestHTML(userData),
    text: generateMonthlyDigestText(userData),
  });
}

export async function sendTestWeeklyDigest(toEmail: string, userData: DigestData): Promise<boolean> {
  const subject = `[TEST] Wekelijkse DBA Kompas Update - ${new Date().toLocaleDateString('nl-NL')}`;
  return sendEmail({
    to: toEmail,
    subject,
    html: generateWeeklyDigestHTML(userData),
    text: generateWeeklyDigestText(userData),
  });
}

export async function sendTestUrgentNotification(toEmail: string, notification: { title: string; message: string }): Promise<boolean> {
  return sendEmail({
    to: toEmail,
    subject: `[TEST] Urgente Melding - DBA Kompas`,
    html: generateUrgentNotificationHTML(notification),
    text: `URGENTE MELDING - DBA Kompas\n\n${notification.title}\n\n${notification.message}\n\nBekijk meer op: https://dbakompas.nl`,
  });
}

export function getWeeklyDigestPreview(userData: DigestData): string {
  return generateWeeklyDigestHTML(userData);
}

export function getUrgentNotificationPreview(notification: { title: string; message: string }): string {
  return generateUrgentNotificationHTML(notification);
}

function generateUrgentNotificationHTML(notification: { title: string; message: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Urgente Melding</title></head><body style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f8f7f4;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
<div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:white;padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
<div style="font-size:28px;font-weight:bold;">DBA Kompas</div><div style="opacity:0.9;font-size:14px;">Urgente Melding</div></div>
<div style="background:white;padding:30px;border:1px solid #e5e7eb;">
<div style="background:#fef2f2;border:2px solid #ef4444;border-radius:12px;padding:24px;margin:20px 0;">
<div style="font-size:40px;text-align:center;">&#9888;&#65039;</div>
<div style="color:#dc2626;font-size:22px;font-weight:bold;margin-bottom:12px;text-align:center;">${notification.title}</div>
<div style="color:#7f1d1d;font-size:16px;line-height:1.7;">${notification.message}</div></div>
<p style="color:#4b5563;">Log in op DBA Kompas voor meer details.</p>
<center><a href="https://dbakompas.nl" style="display:inline-block;background:#6bafa0;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">Bekijk in Dashboard</a></center></div>
<div style="padding:20px;background:#f1f5f9;text-align:center;font-size:12px;color:#64748b;border-radius:0 0 12px 12px;">
<p>Je ontvangt deze email omdat je urgente meldingen hebt ingeschakeld.</p>
<p><strong>DBA Kompas</strong></p></div></div></body></html>`;
}

function generateWeeklyDigestHTML(data: DigestData): string {
  const { newsItems, documentsSummary, notifications, userProfile } = data;
  const dateStr = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const newsHTML = newsItems.length > 0
    ? newsItems.slice(0, 5).map(item => `
      <div style="margin:15px 0;padding:15px;background:#f8fafc;border-radius:8px;border-left:4px solid #6bafa0;">
      <div style="font-weight:600;color:#1e3a5f;margin-bottom:8px;">${item.title}</div>
      <div style="color:#4b5563;font-size:14px;margin-bottom:10px;">${item.summary || ''}</div>
      <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#fefce8;color:#ca8a04;">${item.impact || 'info'}</span>
      <span style="color:#64748b;font-size:12px;margin-left:8px;">${item.category || ''}</span></div>`).join('')
    : '<p style="color:#64748b;">Geen nieuwe updates deze week.</p>';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Wekelijkse Update</title></head><body style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f8f7f4;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
<div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:white;padding:30px 20px;text-align:center;border-radius:12px 12px 0 0;">
<div style="font-size:28px;font-weight:bold;">DBA Kompas</div>
<div style="opacity:0.9;font-size:14px;">Wekelijkse Update - ${dateStr}</div></div>
<div style="background:white;padding:20px 30px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
<p style="margin:0;">Hallo <strong>${userProfile?.name || "ZZP'er"}</strong>,</p>
<p style="margin:10px 0 0;color:#4b5563;">Hier is je wekelijkse overzicht.</p></div>
<div style="padding:25px 30px;background:white;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
<div style="font-size:18px;font-weight:600;color:#1e3a5f;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #6bafa0;">Nieuws &amp; Regelgeving</div>
${newsHTML}</div>
<div style="padding:25px 30px;background:white;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
<div style="font-size:18px;font-weight:600;color:#1e3a5f;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #6bafa0;">DBA-Check Samenvatting</div>
<table width="100%"><tr>
<td style="text-align:center;padding:15px;background:#f8fafc;border-radius:8px;"><div style="font-size:28px;font-weight:bold;color:#1e3a5f;">${documentsSummary.processed}</div><div style="font-size:12px;color:#64748b;">Geanalyseerd</div></td>
<td style="text-align:center;padding:15px;background:#f0fdf4;"><div style="font-size:28px;font-weight:bold;color:#16a34a;">${documentsSummary.compliant}</div><div style="font-size:12px;color:#64748b;">Laag risico</div></td>
<td style="text-align:center;padding:15px;background:#fef2f2;border-radius:8px;"><div style="font-size:28px;font-weight:bold;color:#dc2626;">${documentsSummary.warnings}</div><div style="font-size:12px;color:#64748b;">Actie vereist</div></td>
</tr></table></div>
${notifications.length > 0 ? `<div style="padding:25px 30px;background:white;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
<div style="font-size:18px;font-weight:600;color:#1e3a5f;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #6bafa0;">Meldingen</div>
${notifications.slice(0, 3).map(n => `<div style="padding:12px 15px;background:#fffbeb;border-radius:8px;margin:10px 0;border-left:4px solid #f59e0b;"><strong>${n.title}</strong><br><span style="color:#78716c;font-size:14px;">${n.message}</span></div>`).join('')}</div>` : ''}
<div style="padding:25px 30px;background:white;text-align:center;border:1px solid #e5e7eb;">
<a href="https://dbakompas.nl" style="display:inline-block;background:#6bafa0;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">Open DBA Kompas</a></div>
<div style="padding:25px;background:#f1f5f9;text-align:center;font-size:12px;color:#64748b;border-radius:0 0 12px 12px;">
<p>Je ontvangt dit weekoverzicht omdat je dit hebt ingeschakeld.</p>
<p><strong>DBA Kompas</strong></p></div></div></body></html>`;
}

function generateWeeklyDigestText(data: DigestData): string {
  const { newsItems, documentsSummary, notifications, userProfile } = data;
  const newsText = newsItems.length > 0
    ? newsItems.slice(0, 5).map(item => `- ${item.title}\n  ${item.summary || ''}\n  Impact: ${(item.impact || 'info').toUpperCase()}`).join('\n\n')
    : 'Geen nieuwe updates deze week.';

  return `DBA KOMPAS - WEKELIJKSE UPDATE

Hallo ${userProfile?.name || "ZZP'er"},

=== NIEUWS ===
${newsText}

=== DBA-CHECK ===
Geanalyseerd: ${documentsSummary.processed}
Laag risico: ${documentsSummary.compliant}
Actie vereist: ${documentsSummary.warnings}

${notifications.length > 0 ? `=== MELDINGEN ===\n${notifications.slice(0, 3).map(n => `- ${n.title}: ${n.message}`).join('\n')}` : ''}

Bekijk dashboard: https://dbakompas.nl
`;
}

function generateMonthlyDigestHTML(data: DigestData): string {
  return generateWeeklyDigestHTML(data)
    .replace(/Wekelijkse/g, 'Maandelijkse')
    .replace(/weekoverzicht/g, 'maandoverzicht')
    .replace(/deze week/g, 'deze maand');
}

function generateMonthlyDigestText(data: DigestData): string {
  return generateWeeklyDigestText(data)
    .replace(/WEKELIJKSE/g, 'MAANDELIJKSE')
    .replace(/deze week/g, 'deze maand');
}
