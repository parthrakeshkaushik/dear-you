import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import { isValidE164Phone } from '@/lib/security/phone-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, identifier, captcha_token } = body;

    const cleanId = identifier?.trim();
    if (!method || !cleanId) {
      return NextResponse.json(
        { error: 'Registration method and account identifier are required.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Optional CAPTCHA check on resends to prevent bot flooding
    if (captcha_token) {
      const captchaResult = await verifyCaptchaToken(captcha_token, ip);
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: captchaResult.error || 'CAPTCHA validation failed.' },
          { status: 400 }
        );
      }
    }

    // Rate limiting: 3 OTP requests per 5 minutes per identifier
    const rateKey = `resend_otp:${ip}:${cleanId.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateKey, 3, 5 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests. Please wait ${rateCheck.retryAfterSeconds} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const supabaseAdmin = createAdminClient();

    if (method === 'email') {
      const cleanEmail = cleanId.toLowerCase();
      if (!cleanEmail.includes('@') || isDisposableEmail(cleanEmail)) {
        return NextResponse.json(
          { error: 'Valid non-disposable email address is required.' },
          { status: 400 }
        );
      }

      try {
        await supabaseAdmin.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
      } catch (err: any) {
        console.warn('Supabase resend email note:', err?.message);
      }

      return NextResponse.json({
        success: true,
        message: 'A fresh verification code has been dispatched to your email.',
        cooldown: 60,
      });
    }

    if (method === 'mobile') {
      if (!isValidE164Phone(cleanId)) {
        return NextResponse.json(
          { error: 'Valid E.164 mobile number is required.' },
          { status: 400 }
        );
      }

      try {
        await supabaseAdmin.auth.resend({
          type: 'sms',
          phone: cleanId,
        });
      } catch (err: any) {
        console.warn('Supabase resend SMS note:', err?.message);
      }

      return NextResponse.json({
        success: true,
        message: 'A fresh verification code has been dispatched via SMS.',
        cooldown: 60,
      });
    }

    return NextResponse.json(
      { error: 'Invalid verification method.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Send OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while dispatching the OTP.' },
      { status: 500 }
    );
  }
}
