import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Zenant <onboarding@resend.dev>'

function guard() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return false
  }
  return true
}

function htmlEmail(title: string, body: string): string {
  return `<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#4f46e5;padding:28px 36px;">
    <div style="color:#fff;font-size:18px;font-weight:700;margin-bottom:10px;">Zenant</div>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">${title}</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;font-size:14px;color:#374151;line-height:1.6;">${body}</td></tr>
  <tr><td style="padding:16px 36px;border-top:1px solid #f3f4f6;">
    <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">Zenant · Resident Management Platform</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

export async function sendTenantInvite({
  toEmail, toName, landlordName, propertyName, unitNumber, rentAmount, inviteUrl,
}: {
  toEmail: string; toName: string; landlordName: string; propertyName: string
  unitNumber: string; rentAmount: number; inviteUrl: string
}) {
  if (!guard()) return
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `You've been invited to your Zenant resident portal`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#4f46e5;padding:32px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 14px;display:inline-block;">
                  <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">Zenant</span>
                </td>
              </tr>
            </table>
            <p style="color:#c7d2fe;font-size:13px;margin:16px 0 4px;">You've been invited</p>
            <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Welcome to your resident portal</h1>
            <p style="color:#c7d2fe;font-size:14px;margin:8px 0 0;">from ${landlordName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi ${toName},</p>
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">
              Your landlord has set up a Zenant portal for your residence. You can use it to pay rent, submit maintenance requests, and message your property manager.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Your Home</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding:3px 0;">Property</td>
                    <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">${propertyName}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding:3px 0;">Unit</td>
                    <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">#${unitNumber}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding:3px 0;">Monthly Rent</td>
                    <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">$${rentAmount.toLocaleString()}/mo</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;">
                  Set Up My Account
                </a>
              </td></tr>
            </table>
            <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Or copy this link:</p>
            <p style="background:#f3f4f6;border-radius:8px;padding:10px 14px;font-size:12px;color:#4b5563;word-break:break-all;margin:0 0 24px;">${inviteUrl}</p>
            <p style="color:#9ca3af;font-size:12px;margin:0;">This invite expires in 7 days and is for ${toEmail} only.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f3f4f6;">
            <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">Zenant · Resident Management Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}

export async function sendNewApplicationAlert({
  toEmail, landlordName, applicantName, propertyName, unitNumber, aiScore,
}: {
  toEmail: string; landlordName: string; applicantName: string
  propertyName: string; unitNumber: string; aiScore: number
}) {
  if (!guard()) return
  const scoreColor = aiScore >= 75 ? '#10b981' : aiScore >= 55 ? '#f59e0b' : '#ef4444'
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `New application received for Unit #${unitNumber}`,
    html: htmlEmail('New Rental Application', `
      <p>Hi ${landlordName},</p>
      <p><strong>${applicantName}</strong> has submitted an application for <strong>${propertyName} — Unit #${unitNumber}</strong>.</p>
      <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin:20px 0;display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;font-weight:800;color:${scoreColor};">${aiScore}</span>
        <span style="color:#6b7280;font-size:13px;">AI Screening Score (out of 100)</span>
      </div>
      <p>Log in to Zenant to review the full application.</p>
    `),
  })
}

export async function sendMaintenanceAlert({
  toEmail, landlordName, tenantName, propertyName, unitNumber, title, priority,
}: {
  toEmail: string; landlordName: string; tenantName: string
  propertyName: string; unitNumber: string; title: string; priority: string
}) {
  if (!guard()) return
  const priorityColor = priority === 'URGENT' ? '#ef4444' : priority === 'HIGH' ? '#f59e0b' : '#6b7280'
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `Maintenance request: ${title} — ${propertyName} #${unitNumber}`,
    html: htmlEmail('New Maintenance Request', `
      <p>Hi ${landlordName},</p>
      <p>Your tenant <strong>${tenantName}</strong> submitted a maintenance request for <strong>${propertyName} — Unit #${unitNumber}</strong>.</p>
      <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin:20px 0;">
        <div style="font-size:13px;font-weight:700;color:#0d0f18;">${title}</div>
        <div style="margin-top:6px;display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:${priorityColor};background:${priorityColor}1a;">${priority}</div>
      </div>
      <p>Log in to Zenant to view and respond to the request.</p>
    `),
  })
}

export async function sendMaintenanceStatusUpdate({
  toEmail, tenantName, title, status,
}: {
  toEmail: string; tenantName: string; title: string; status: string
}) {
  if (!guard()) return
  const statusLabel: Record<string, string> = {
    OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed',
  }
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `Maintenance update: ${title}`,
    html: htmlEmail('Maintenance Request Updated', `
      <p>Hi ${tenantName},</p>
      <p>Your maintenance request <strong>"${title}"</strong> has been updated.</p>
      <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin:20px 0;">
        <span style="font-size:13px;color:#6b7280;">New status: </span>
        <strong style="font-size:13px;color:#0d0f18;">${statusLabel[status] ?? status}</strong>
      </div>
      <p>Log in to Zenant to view the full update.</p>
    `),
  })
}

export async function sendPaymentReceivedAlert({
  toEmail, landlordName, tenantName, amount, propertyName, unitNumber,
}: {
  toEmail: string; landlordName: string; tenantName: string
  amount: number; propertyName: string; unitNumber: string
}) {
  if (!guard()) return
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `Rent payment received — ${propertyName} #${unitNumber}`,
    html: htmlEmail('Rent Payment Received', `
      <p>Hi ${landlordName},</p>
      <p><strong>${tenantName}</strong> has paid rent for <strong>${propertyName} — Unit #${unitNumber}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#10b981;">$${(amount / 100).toLocaleString()}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Payment received</div>
      </div>
    `),
  })
}

export async function sendRentReminder({
  toEmail, tenantName, amount, dueDateStr, propertyName, unitNumber,
}: {
  toEmail: string; tenantName: string; amount: number
  dueDateStr: string; propertyName: string; unitNumber: string
}) {
  if (!guard()) return
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `Rent reminder — due ${dueDateStr}`,
    html: htmlEmail('Rent Due Soon', `
      <p>Hi ${tenantName},</p>
      <p>This is a friendly reminder that your rent for <strong>${propertyName} — Unit #${unitNumber}</strong> is due on <strong>${dueDateStr}</strong>.</p>
      <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#4f46e5;">$${(amount / 100).toLocaleString()}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Due on ${dueDateStr}</div>
      </div>
      <p>Log in to Zenant to pay your rent.</p>
    `),
  })
}

export async function sendOverdueAlert({
  toEmail, landlordName, tenantName, amount, daysOverdue, propertyName, unitNumber,
}: {
  toEmail: string; landlordName: string; tenantName: string
  amount: number; daysOverdue: number; propertyName: string; unitNumber: string
}) {
  if (!guard()) return
  await resend.emails.send({
    from: FROM, to: toEmail,
    subject: `Overdue rent — ${propertyName} #${unitNumber}`,
    html: htmlEmail('Rent Payment Overdue', `
      <p>Hi ${landlordName},</p>
      <p><strong>${tenantName}</strong>'s rent for <strong>${propertyName} — Unit #${unitNumber}</strong> is <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ef4444;">$${(amount / 100).toLocaleString()}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">${daysOverdue} days past due</div>
      </div>
      <p>Log in to Zenant to review and follow up.</p>
    `),
  })
}
