import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDisposableEmail } from '@/lib/security/disposable-email';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { safeUpsertAdminUser } from '@/lib/security/otp-store';
import {
  signSessionExpiryToken,
  setSessionCookies,
  DEFAULT_SESSION_DAYS,
} from '@/lib/auth/persistent-session';

/**
 * Direct, OTP-free registration endpoint.
 * Creates an immediately verified user in Supabase Auth,
 * records policy acceptance, establishes a 14-day persistent session cookie,
 * and grants immediate access to the Creator Dashboard (/admin).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, password, terms_accepted } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Validate Terms & Conditions Checkbox
    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'You must agree to the Terms and Conditions and Privacy Policy to register.' },
        { status: 400 }
      );
    }

    // 2. Validate Full Name
    const displayName = full_name?.trim();
    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name.' },
        { status: 400 }
      );
    }

    // 3. Validate Email
    const cleanEmail = email?.trim()?.toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (isDisposableEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Disposable or temporary email addresses are not permitted. Please use your genuine email.' },
        { status: 400 }
      );
    }

    // 4. Validate Password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length.' },
        { status: 400 }
      );
    }

    // 5. Rate Limit Registration Attempts (10 per 15 minutes per IP)
    const rateCheck = checkRateLimit(`reg:${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 6. Check if user already exists
    let userId: string | null = null;
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingAuthUser) {
      // If user exists and is already confirmed
      if (existingAuthUser.email_confirmed_at) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in.' },
          { status: 409 }
        );
      }

      // Unconfirmed previous signup: immediately confirm and update password
      userId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          registration_method: 'email',
          email_verified: true,
        },
      });
    } else {
      // Create fresh user directly with email_confirm: true (no OTP needed)
      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            registration_method: 'email',
            email_verified: true,
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

    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Upsert user into admin_users table
    await safeUpsertAdminUser(supabaseAdmin, {
      id: userId,
      email: cleanEmail,
      display_name: displayName,
      registration_method: 'email',
      email_verified: true,
      role: 'creator',
      account_status: 'active',
      last_active_at: new Date().toISOString(),
    });

    // 8. Record policy acceptance
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

    // 9. Establish 14-day persistent session token
    const rememberDays = 14;
    const { token, expiresAt, maxAgeSeconds } = await signSessionExpiryToken(
      userId,
      rememberDays
    );

    const response = NextResponse.json({
      success: true,
      userId,
      email: cleanEmail,
      displayName,
      rememberDays,
      expiresAt: new Date(expiresAt).toISOString(),
      redirect: '/admin',
      message: 'Account created successfully! Welcome to Dear You.',
    });

    // 10. Set secure 14-day session cookies
    setSessionCookies(response, token, rememberDays, maxAgeSeconds);

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
