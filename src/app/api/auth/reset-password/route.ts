import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { isValidE164Phone, normalizePhoneNumber } from '@/lib/security/phone-utils';
import { dispatchRecoveryEmail } from '@/lib/security/recovery-email';
import { getResetPasswordUrl } from '@/lib/config/app-url';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, identifier, country_code, captcha_token } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. CAPTCHA verification
    const captchaCheck = await verifyCaptchaToken(captcha_token, ip);
    if (!captchaCheck.success) {
      return NextResponse.json(
        { error: captchaCheck.error || 'CAPTCHA verification failed.' },
        { status: 400 }
      );
    }

    // 2. Rate limiting (5 recovery requests per 15 minutes per IP)
    const rateCheck = checkRateLimit(`pwd_reset:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // ==========================================
    // 3. EMAIL PASSWORD RECOVERY (PRIMARY)
    // ==========================================
    if (method === 'email' || !method) {
      const email = identifier ? String(identifier).trim().toLowerCase() : '';
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!email || !emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }

      const genericConfirmationResponse = {
        success: true,
        message: 'If an account exists with this email address, password reset instructions will be sent.',
      };

      const maskEmail = (str: string) => {
        const [u, d] = str.split('@');
        if (!u || !d) return '***';
        return `${u[0]}***${u[u.length - 1]}@${d}`;
      };

      try {
        // Enforce trusted canonical recovery URL: strictly https://dear-you-wine.vercel.app/reset-password for production
        const redirectUrl = getResetPasswordUrl(request);

        // 1. Check account suspension in admin_users table (correct column: account_status)
        let isSuspended = false;
        try {
          const { data: dbUser } = await supabaseAdmin
            .from('admin_users')
            .select('id, email, account_status')
            .ilike('email', email)
            .maybeSingle();

          if (dbUser && dbUser.account_status === 'suspended') {
            isSuspended = true;
          }
        } catch (dbErr: any) {
          console.warn('[AUTH_DIAGNOSTIC] admin_users lookup note:', dbErr?.message);
        }

        if (isSuspended) {
          console.log(`[AUTH_DIAGNOSTIC] Recovery skipped for suspended account: ${maskEmail(email)}`);
          await new Promise((resolve) => setTimeout(resolve, 350));
          return NextResponse.json(genericConfirmationResponse, { status: 200 });
        }

        // 2. Generate cryptographically signed recovery action link via Supabase Auth admin API
        // If the email is UNREGISTERED, generateLink returns 404 (User with this email not found)
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (linkErr) {
          // If user does not exist: do not send email, do not create user or session
          if (
            linkErr.message?.toLowerCase().includes('not found') ||
            (linkErr as any)?.status === 404
          ) {
            console.log(
              `[AUTH_DIAGNOSTIC] Recovery requested for UNREGISTERED email: ${maskEmail(email)}. Skipped dispatch.`
            );
            // Simulate standard cryptographic delay to eliminate timing side-channel attacks
            await new Promise((resolve) => setTimeout(resolve, 350));
            return NextResponse.json(genericConfirmationResponse, { status: 200 });
          }

          console.error('[AUTH_DIAGNOSTIC] Recovery link generation error:', linkErr.message);
          // Fallback: attempt standard Supabase recovery
          await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
          return NextResponse.json(genericConfirmationResponse, { status: 200 });
        }

        const hashedToken = linkData?.properties?.hashed_token;
        const actionLink = linkData?.properties?.action_link;

        if (!hashedToken && !actionLink) {
          console.error('[AUTH_DIAGNOSTIC] Neither hashed_token nor action_link returned by Supabase Auth for registered user');
          await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
          return NextResponse.json(genericConfirmationResponse, { status: 200 });
        }

        // Construct direct bot-immune recovery URL:
        // When using action_link (https://<ref>.supabase.co/auth/v1/verify?token=...), email scanners
        // (like Gmail Safe Browsing / Defender Safe Links) execute an automated HTTP GET request on incoming emails.
        // Because Supabase OTP tokens are single-use, the scanner consumes the token immediately.
        // When the human user clicks the link 2 minutes later, Supabase returns error=otp_expired.
        //
        // Solution: Send the user directly to our Next.js frontend with the hashed_token:
        // `${redirectUrl}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
        // Scanners only fetch the static HTML shell, leaving the token unburned.
        // The token is verified via client-side JavaScript (supabase.auth.verifyOtp) only when a real human opens the page.
        const recoveryUrl = hashedToken
          ? `${redirectUrl}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
          : actionLink!;

        console.log(`[AUTH_DIAGNOSTIC] Verified registered account: ${maskEmail(email)}. Dispatching recovery email...`);

        // 3. Dispatch recovery email via configured SMTP (Gmail / Custom SMTP)
        const dispatchResult = await dispatchRecoveryEmail(email, recoveryUrl);

        // Record diagnostic audit log
        try {
          await supabaseAdmin.from('developer_audit_logs').insert({
            action_type: 'password_recovery_requested',
            details: {
              targetEmailMasked: maskEmail(email),
              provider: dispatchResult.provider,
              deliveryStatus: dispatchResult.deliveryStatus,
              messageId: dispatchResult.messageId || null,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {}

        if (!dispatchResult.success) {
          console.warn(
            '[AUTH_DIAGNOSTIC] Primary SMTP dispatch failed. Attempting secondary Supabase Auth fallback...'
          );
          // Secondary fallback
          const { error: fallbackErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
          });
          if (fallbackErr) {
            console.error('[AUTH_DIAGNOSTIC] Secondary resetPasswordForEmail error:', fallbackErr.message);
          }
        }
      } catch (err: any) {
        console.error('[AUTH_DIAGNOSTIC] Error during password reset processing:', err?.message || err);
      }

      // Mandatory security requirement: Return the exact same generic message for both registered and unregistered accounts
      return NextResponse.json(genericConfirmationResponse, { status: 200 });
    }

    // ==========================================
    // 4. MOBILE SMS RECOVERY (PRESERVED BACKEND)
    // ==========================================
    if (method === 'mobile') {
      const code = country_code || '+91';
      const e164Phone = normalizePhoneNumber(code, identifier || '');

      if (!isValidE164Phone(e164Phone)) {
        return NextResponse.json(
          { error: 'Please enter a valid mobile number with country code.' },
          { status: 400 }
        );
      }

      try {
        await supabaseAdmin.auth.signInWithOtp({
          phone: e164Phone,
          options: {
            shouldCreateUser: false,
          },
        });
      } catch (err: any) {
        console.error('[AUTH_DIAGNOSTIC] Supabase mobile OTP error:', err?.message || err);
      }

      return NextResponse.json({
        success: true,
        message: 'If an account exists with this mobile number, an SMS recovery code has been sent.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid recovery method specified.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[AUTH_DIAGNOSTIC] Fatal password reset API error:', error);
    // Generic fallback to prevent enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email address, a password reset link will be sent.',
    });
  }
}
