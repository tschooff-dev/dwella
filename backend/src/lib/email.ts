import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTenantInvite({
  toEmail,
  toName,
  landlordName,
  propertyName,
  unitNumber,
  rentAmount,
  inviteUrl,
}: {
  toEmail: string
  toName: string
  landlordName: string
  propertyName: string
  unitNumber: string
  rentAmount: number
  inviteUrl: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping invite email')
    return
  }

  await resend.emails.send({
    from: 'Dwella <noreply@dwellaapp.com>',
    to: toEmail,
    subject: `You've been invited to your Dwella resident portal`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 14px;display:inline-block;">
                  <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">Dwella</span>
                </td>
              </tr>
            </table>
            <p style="color:#c7d2fe;font-size:13px;margin:16px 0 4px;">You've been invited</p>
            <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Welcome to your resident portal</h1>
            <p style="color:#c7d2fe;font-size:14px;margin:8px 0 0;">from ${landlordName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi ${toName},</p>
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">
              Your landlord has set up a Dwella portal for your residence. You can use it to pay rent, submit maintenance requests, and message your property manager.
            </p>

            <!-- Property card -->
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

            <!-- CTA -->
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

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f3f4f6;">
            <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">Dwella · Resident Management Platform</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
