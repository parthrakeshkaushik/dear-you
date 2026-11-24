import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import {
  normalizePhoneNumber,
  isValidE164Phone,
  maskPhoneNumber,
  maskEmail,
  getPhoneBridgeEmail,
} from '@/lib/security/phone-utils';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { generateOtp, safeUpsertAdminUser, safeLogOtp } from '@/lib/security/otp-store';
import { dispatchEmailOtp, dispatchSmsOtp } from '@/lib/security/otp-dispatcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registration_method,
      full_name,
      email,
      country_code,
      mobile_number,
      password,
      terms_accepted,
      captcha_token,
    } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Validate CAPTCHA Token
    const captchaCheck = await verifyCaptchaToken(captcha_token, ip);
    if (!captchaCheck.success) {
      return NextResponse.json(
        { error: captchaCheck.error || 'CAPTCHA verification failed.' },
        { status: 400 }
      );
    }

    // 2. Validate Terms & Conditions Checkbox
    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'You must agree to the Terms and Conditions and Privacy Policy to register.' },
        { status: 400 }
      );
    }

    // 3. Rate Limit Registration Attempts (Max 5 per 15 minutes per IP)
    const rateCheck = checkRateLimit(`reg:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts from this network. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length.' },
        { status: 400 }
      );
    }

    const displayName = full_name?.trim() || 'Gift Creator';
    const supabaseAdmin = createAdminClient();
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // ==========================================
    // OPTION A: EMAIL REGISTRATION FLOW
    // ==========================================
    if (registration_method === 'email') {
      const cleanEmail = email?.trim()?.toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }

      if (isDisposableEmail(cleanEmail)) {
        return NextResponse.json(
          { error: 'Disposable or temporary email addresses are not permitted.' },
          { status: 400 }
        );
      }

      // Check whether user already exists in Supabase Auth
      let userId: string | null = null;
      let existingConfirmed = false;

      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = usersList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (existingAuthUser) {
        existingConfirmed = !!existingAuthUser.email_confirmed_at;
        if (existingConfirmed) {
          return NextResponse.json(
            { error: 'An account with this email address already exists. Please sign in.' },
            { status: 409 }
          );
        }
        // Unconfirmed existing user: refresh password and assign fresh OTP
        userId = existingAuthUser.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: {
            display_name: displayName,
            registration_method: 'email',
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
          },
        });
      } else {
        // Create user via Admin API (bypasses SMTP rate limits)
        const { data: createData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: false,
            user_metadata: {
              display_name: displayName,
              registration_method: 'email',
              otp_code: otpCode,
              otp_expires_at: otpExpiresAt,
            },
          });

        if (createError) {
          if (
            createError.message.includes('already') ||
            createError.message.includes('registered')
          ) {
            return NextResponse.json(
              { error: 'An account with this email address already exists. Please sign in.' },
              { status: 409 }
            );
          }
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        userId = createData?.user?.id || null;
      }

      // Dispatch authentic verification email with 6-digit OTP
      await dispatchEmailOtp(cleanEmail, otpCode, displayName);

      // Upsert into admin_users safely with schema resilience
      if (userId) {
        await safeUpsertAdminUser(supabaseAdmin, {
          id: userId,
          email: cleanEmail,
          display_name: displayName,
          registration_method: 'email',
          email_verified: false,
          role: 'creator',
          account_status: 'active',
          last_active_at: new Date().toISOString(),
        });

        // Record policy acceptance
        try {
          await supabaseAdmin.from('policy_acceptances').insert({
            user_id: userId,
            terms_accepted: true,
            terms_version: 'v1.0',
            privacy_policy_version: 'v1.0',
            ip_address: ip,
          });
        } catch (policyErr) {
          console.warn('Policy acceptance log note:', policyErr);
        }

        // Audit log in otp_verification_logs
        await safeLogOtp(supabaseAdmin, {
          destination: cleanEmail,
          destination_type: 'email',
          action_type: 'signup',
          expires_at: otpExpiresAt,
          ip_address: ip,
        });
      }

      return NextResponse.json({
        success: true,
        registration_method: 'email',
        destination: maskEmail(cleanEmail),
        raw_identifier: cleanEmail,
        message: 'Verification code sent to your email address.',
      });
    }

    // ==========================================
    // OPTION B: MOBILE REGISTRATION FLOW
    // ==========================================
    if (registration_method === 'mobile') {
      const selectedCode = country_code || '+91';
      const rawNumber = mobile_number || '';
      const e164Phone = normalizePhoneNumber(selectedCode, rawNumber);

      if (!isValidE164Phone(e164Phone)) {
        return NextResponse.json(
          { error: 'Please enter a valid mobile number with correct digits.' },
          { status: 400 }
        );
      }

      const bridgeEmail = getPhoneBridgeEmail(e164Phone);

      // Check whether user already exists with this mobile bridge email
      let userId: string | null = null;
      let existingConfirmed = false;

      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = usersList?.users?.find(
        (u) =>
          u.email?.toLowerCase() === bridgeEmail.toLowerCase() ||
          u.user_metadata?.phone === e164Phone
      );

      if (existingAuthUser) {
        existingConfirmed =
          !!existingAuthUser.phone_confirmed_at ||
          !!existingAuthUser.email_confirmed_at ||
          existingAuthUser.user_metadata?.phone_verified === true;

        if (existingConfirmed) {
          return NextResponse.json(
            { error: 'An account with this mobile number already exists. Please sign in.' },
            { status: 409 }
          );
        }

        // Unconfirmed existing mobile user: refresh password and assign fresh OTP
        userId = existingAuthUser.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: {
            phone: e164Phone,
            country_code: selectedCode,
            display_name: displayName,
            registration_method: 'mobile',
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
          },
        });
      } else {
        // Create user with bridge email to bypass disabled phone provider
        const { data: createData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: bridgeEmail,
            password,
            email_confirm: false,
            phone_confirm: false,
            user_metadata: {
              phone: e164Phone,
              country_code: selectedCode,
              display_name: displayName,
              registration_method: 'mobile',
              otp_code: otpCode,
              otp_expires_at: otpExpiresAt,
            },
          });

        if (createError) {
          if (
            createError.message.includes('already') ||
            createError.message.includes('registered')
          ) {
            return NextResponse.json(
              { error: 'An account with this mobile number already exists. Please sign in.' },
              { status: 409 }
            );
          }
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        userId = createData?.user?.id || null;
      }

      // Upsert into admin_users safely
      if (userId) {
        await safeUpsertAdminUser(supabaseAdmin, {
          id: userId,
          email: bridgeEmail,
          phone: e164Phone,
          country_code: selectedCode,
          display_name: displayName,
          registration_method: 'mobile',
          phone_verified: false,
          role: 'creator',
          account_status: 'active',
          last_active_at: new Date().toISOString(),
        });

        // Record policy acceptance
        try {
          await supabaseAdmin.from('policy_acceptances').insert({
            user_id: userId,
            terms_accepted: true,
            terms_version: 'v1.0',
            privacy_policy_version: 'v1.0',
            ip_address: ip,
          });
        } catch (policyErr) {
          console.warn('Policy acceptance log note:', policyErr);
        }

        // Audit log in otp_verification_logs
        await safeLogOtp(supabaseAdmin, {
          destination: e164Phone,
          destination_type: 'mobile',
          action_type: 'signup',
          expires_at: otpExpiresAt,
          ip_address: ip,
        });
      }

      // Dispatch authentic SMS with 6-digit OTP
      await dispatchSmsOtp(e164Phone, otpCode);

      return NextResponse.json({
        success: true,
        registration_method: 'mobile',
        destination: maskPhoneNumber(e164Phone),
        raw_identifier: e164Phone,
        message: 'Verification code sent by SMS to your mobile number.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid registration method. Must be email or mobile.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
