import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { isValidE164Phone, normalizePhoneNumber } from '@/lib/security/phone-utils';

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

    // 2. Rate limiting (3 recovery attempts per 15 minutes)
    const rateCheck = checkRateLimit(`pwd_reset:${ip}`, 3, 15 * 60 * 1000);
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

    if (method === 'email') {
      const email = identifier?.trim()?.toLowerCase();
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }

      try {
        await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/reset-password`,
        });
      } catch (err: any) {
        console.warn('Supabase password reset email note:', err?.message);
      }

      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    }

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
        // Send SMS OTP for password recovery
        await supabaseAdmin.auth.signInWithOtp({
          phone: e164Phone,
          options: {
            shouldCreateUser: false,
          },
        });
      } catch (err: any) {
        console.warn('Supabase mobile password reset OTP note:', err?.message);
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
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing password reset.' },
      { status: 500 }
    );
  }
}
