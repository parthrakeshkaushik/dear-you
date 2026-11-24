import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { isDisposableEmail } from '@/lib/security/disposable-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Disposable or temporary email addresses cannot be used.' },
        { status: 400 }
      );
    }

    // Rate limiting: 3 resend requests per 5 minutes
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `resend:${ip}:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many resend attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before requesting another email.`,
        },
        { status: 429 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
    } catch (supaErr) {
      console.warn('Supabase resend attempt note:', supaErr);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred.' },
      { status: 500 }
    );
  }
}
