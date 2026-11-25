import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;

  const isRecovery = type === 'recovery' || requestUrl.searchParams.get('next') === '/reset-password';
  const defaultNext = isRecovery ? '/reset-password' : '/admin';
  const next = requestUrl.searchParams.get('next') || defaultNext;

  const origin = requestUrl.origin;

  try {
    const supabase = createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        if (isRecovery) {
          return NextResponse.redirect(`${origin}/reset-password`);
        }
        return NextResponse.redirect(`${origin}${next}?verified=true`);
      }
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error) {
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/reset-password`);
        }
        return NextResponse.redirect(`${origin}${next}?verified=true`);
      }
    }
  } catch (err) {
    console.error('Email callback verification error:', err);
  }

  // If this was a password recovery callback and verification failed:
  if (isRecovery) {
    return NextResponse.redirect(`${origin}/reset-password?error=expired`);
  }

  // Redirect to verified onboarding or verification notice
  return NextResponse.redirect(`${origin}/admin?verified=true`);
}
