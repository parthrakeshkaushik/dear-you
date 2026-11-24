import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCaptchaToken } from '@/lib/security/captcha';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import { normalizePhoneNumber, isValidE164Phone, maskPhoneNumber, maskEmail } from '@/lib/security/phone-utils';
import { checkRateLimit } from '@/lib/security/rate-limiter';

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

      // Check account uniqueness
      const { data: existingUser } = await supabaseAdmin
        .from('admin_users')
        .select('id, email_verified')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser && existingUser.email_verified) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in.' },
          { status: 409 }
        );
      }

      // Supabase Email SignUp (triggers email OTP or confirmation token)
      const origin =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000';

      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            display_name: displayName,
            registration_method: 'email',
          },
        },
      });

      if (authError && !authError.message.includes('fetch') && !authError.message.includes('placeholder')) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const userId = authData?.user?.id;

      // Upsert into admin_users
      if (userId) {
        await supabaseAdmin.from('admin_users').upsert({
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
        await supabaseAdmin.from('policy_acceptances').insert({
          user_id: userId,
          terms_accepted: true,
          terms_version: 'v1.0',
          privacy_policy_version: 'v1.0',
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

      // Check account uniqueness
      const { data: existingPhoneUser } = await supabaseAdmin
        .from('admin_users')
        .select('id, phone_verified')
        .eq('phone', e164Phone)
        .maybeSingle();

      if (existingPhoneUser && existingPhoneUser.phone_verified) {
        return NextResponse.json(
          { error: 'An account with this mobile number already exists. Please sign in.' },
          { status: 409 }
        );
      }

      // Supabase Phone SignUp
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        phone: e164Phone,
        password,
        options: {
          data: {
            display_name: displayName,
            registration_method: 'mobile',
            country_code: selectedCode,
          },
        },
      });

      if (authError && !authError.message.includes('fetch') && !authError.message.includes('placeholder')) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const userId = authData?.user?.id;

      if (userId) {
        await supabaseAdmin.from('admin_users').upsert({
          id: userId,
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
        await supabaseAdmin.from('policy_acceptances').insert({
          user_id: userId,
          terms_accepted: true,
          terms_version: 'v1.0',
          privacy_policy_version: 'v1.0',
          ip_address: ip,
        });
      }

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
