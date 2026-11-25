/**
 * DEAR YOU — Password Recovery Email Dispatcher
 *
 * Generates branded, accessible HTML password-reset emails and dispatches
 * them via configured SMTP (Gmail / Custom SMTP) or supported API gateways.
 */

import nodemailer from 'nodemailer';

export interface RecoveryDispatchResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  deliveryStatus: 'sent_via_smtp' | 'fallback_supabase_attempted' | 'failed';
}

/**
 * Builds the responsive, branded HTML email template for password recovery.
 */
export function buildRecoveryEmailHtml(actionLink: string, recipientEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Dear You Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1625;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="540" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: 28px; box-shadow: 0 12px 36px rgba(0,0,0,0.05); padding: 40px 32px; text-align: center;">
          
          <!-- Dear You Brand Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img
                      src="https://dear-you-wine.vercel.app/brand/logo.png"
                      alt="Dear You"
                      width="54"
                      height="54"
                      style="display: block; width: 54px; height: 54px; object-fit: contain; margin: 0 auto;"
                    />
                  </td>
                </tr>
              </table>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; margin: 16px 0 4px 0; color: #1A1625; letter-spacing: -0.5px;">
                Dear You
              </h1>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #7C3AED; font-weight: 600; margin: 0;">
                Account Security
              </p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom: 20px; text-align: left;">
              <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: normal; color: #1A1625; margin: 0 0 12px 0;">
                Reset Your Password
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 12px 0;">
                We received a request to reset the password for your Dear You account (<strong>${recipientEmail}</strong>).
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0;">
                Click the button below to choose a new password and regain access to your Gift Creator Studio:
              </p>
            </td>
          </tr>

          <!-- Primary Call to Action Button -->
          <tr>
            <td align="center" style="padding: 24px 0 28px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);">
                    <a
                      href="${actionLink}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display: inline-block; padding: 14px 36px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 9999px; letter-spacing: 0.2px;"
                    >
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Link Fallback & Expiry Notice -->
          <tr>
            <td style="background-color: #FBF9FE; border: 1px solid #EDE9FE; border-radius: 16px; padding: 18px 20px; text-align: left; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #6D28D9; font-weight: 600; margin: 0 0 6px 0;">
                ⏱ Link Expiry Notice:
              </p>
              <p style="font-size: 12px; line-height: 1.5; color: #4B5563; margin: 0 0 10px 0;">
                For your security, this password reset link is <strong>single-use</strong> and expires in <strong>1 hour</strong>.
              </p>
              <p style="font-size: 11px; color: #6B7280; margin: 0 0 6px 0;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 11px; word-break: break-all; color: #7C3AED; margin: 0; font-family: monospace;">
                <a href="${actionLink}" style="color: #7C3AED; text-decoration: underline;">${actionLink}</a>
              </p>
            </td>
          </tr>

          <!-- Security Explanation -->
          <tr>
            <td style="border-top: 1px solid #F3F4F6; padding-top: 24px; text-align: left;">
              <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; margin: 0 0 8px 0;">
                🔒 <strong>Did not request this reset?</strong>
              </p>
              <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; margin: 0;">
                If you did not make this request, you can safely ignore this email. Your account remains completely secure and your current password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 28px; font-size: 11px; color: #9CA3AF; text-align: center;">
              © ${new Date().getFullYear()} Dear You • Every person deserves a little something special.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches a password recovery email using configured SMTP credentials (Gmail App Password).
 */
export async function dispatchRecoveryEmail(
  recipientEmail: string,
  actionLink: string
): Promise<RecoveryDispatchResult> {
  const cleanEmail = recipientEmail.trim().toLowerCase();

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpFrom = process.env.SMTP_FROM || `"Dear You" <${smtpUser || 'support@dearyou.com'}>`;

  // 1. Check if SMTP credentials exist
  if (!smtpUser || !smtpPass) {
    console.warn('[RECOVERY_DISPATCH] SMTP credentials missing in environment.');
    return {
      success: false,
      provider: 'none',
      error: 'SMTP credentials not configured.',
      deliveryStatus: 'failed',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: cleanEmail,
      subject: 'Reset Your Dear You Password',
      text: `Hello,\n\nWe received a request to reset your password for Dear You.\n\nClick the link below to choose a new password:\n${actionLink}\n\nThis link is single-use and will expire in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email.\n\n— The Dear You Team`,
      html: buildRecoveryEmailHtml(actionLink, cleanEmail),
    });

    console.log(`[RECOVERY_DISPATCH] ✓ Password reset email sent via SMTP (${smtpHost}) to ${cleanEmail}`);
    console.log(`[RECOVERY_DISPATCH] MessageId: ${info.messageId}, Accepted:`, info.accepted);

    return {
      success: true,
      provider: `SMTP (${smtpHost})`,
      messageId: info.messageId,
      deliveryStatus: 'sent_via_smtp',
    };
  } catch (err: any) {
    console.error(`[RECOVERY_DISPATCH] ✗ SMTP delivery failed (${smtpHost}):`, err?.message);
    return {
      success: false,
      provider: `SMTP (${smtpHost})`,
      error: err?.message || 'SMTP delivery failed',
      deliveryStatus: 'failed',
    };
  }
}
