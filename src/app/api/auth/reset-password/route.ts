import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { isValidE164Phone, normalizePhoneNumber } from '@/lib/security/phone-utils';

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
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

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
        message: 'If an account exists with this email address, a password reset link will be sent.',
      };

      try {
        // Check account eligibility in admin_users table
        const { data: dbUser } = await supabaseAdmin
          .from('admin_users')
          .select('id, email, status')
          .ilike('email', email)
          .maybeSingle();

        // Account is eligible if present and not permanently suspended
        const isEligible = Boolean(dbUser?.id && dbUser?.status !== 'suspended');

        if (isEligible) {
          // Direct users to the dedicated /reset-password route on the active domain
          const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
          const redirectUrl = isLocal
            ? `${origin}/reset-password`
            : origin.includes('dear-you')
            ? `${origin}/reset-password`
            : 'https://dear-you-wine.vercel.app/reset-password';

          const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
          });

          if (resetErr) {
            console.error('[AUTH_DIAGNOSTIC] Supabase resetPasswordForEmail error:', resetErr.message);
          }
        } else {
          // Simulate standard processing time to prevent timing side-channel enumeration attacks
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      } catch (err: any) {
        // Securely log technical diagnostics without leaking details to public caller
        console.error('[AUTH_DIAGNOSTIC] Error during password reset lookup:', err?.message || err);
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
