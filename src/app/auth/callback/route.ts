import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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
  const targetRedirectUrl = isRecovery ? `${origin}/reset-password` : `${origin}${next}?verified=true`;

  let response = NextResponse.redirect(targetRedirectUrl);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(targetRedirectUrl);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error) {
        return response;
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
