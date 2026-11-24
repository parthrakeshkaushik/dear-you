import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import { isValidE164Phone, getPhoneBridgeEmail } from '@/lib/security/phone-utils';
import { generateOtp, safeLogOtp } from '@/lib/security/otp-store';

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

    const supabaseAdmin = createAdminClient();
    const targetEmail =
      method === 'email'
        ? cleanId.toLowerCase()
        : getPhoneBridgeEmail(cleanId).toLowerCase();

    // Check if disposable email
    if (method === 'email') {
      if (!cleanId.includes('@') || isDisposableEmail(cleanId)) {
        return NextResponse.json(
          { error: 'Valid non-disposable email address is required.' },
          { status: 400 }
        );
      }
    } else if (method === 'mobile') {
      if (!isValidE164Phone(cleanId)) {
        return NextResponse.json(
          { error: 'Valid E.164 mobile number is required.' },
          { status: 400 }
        );
      }
    }

    // Find the user
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersList?.users?.find(
      (u) =>
        u.email?.toLowerCase() === targetEmail ||
        u.user_metadata?.phone === cleanId ||
        u.phone === cleanId
    );

    const freshOtp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          otp_code: freshOtp,
          otp_expires_at: otpExpiresAt,
        },
      });

      // Audit log
      await safeLogOtp(supabaseAdmin, {
        destination: cleanId,
        destination_type: method,
        action_type: 'signup',
        expires_at: otpExpiresAt,
        ip_address: ip,
      });
    }

    // If email method, try to trigger email dispatch
    if (method === 'email') {
      const origin =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000';

      try {
        await supabaseAdmin.auth.resend({
          type: 'signup',
          email: cleanId.toLowerCase(),
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
      } catch (err: any) {
        console.warn('Supabase resend email note (handled gracefully):', err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        method === 'email'
          ? 'A fresh verification code has been dispatched to your email.'
          : 'A fresh verification code has been dispatched to your mobile number.',
      cooldown: 60,
    });
  } catch (error: any) {
    console.error('Send OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while sending OTP.' },
      { status: 500 }
    );
  }
}
