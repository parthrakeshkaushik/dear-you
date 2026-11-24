import { createBrowserClient } from '@supabase/ssr';
import { DURATION_COOKIE_NAME, DEFAULT_SESSION_DAYS } from '@/lib/auth/persistent-session';

export function createClient(customMaxAgeSeconds?: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Determine lifetime from cookie or default to 14 days
  let maxAge = customMaxAgeSeconds;
  if (!maxAge && typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`(?:^|; )${DURATION_COOKIE_NAME}=([0-9]+)`));
    const days = match ? parseInt(match[1], 10) : DEFAULT_SESSION_DAYS;
    maxAge = (days || DEFAULT_SESSION_DAYS) * 24 * 60 * 60;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge || DEFAULT_SESSION_DAYS * 24 * 60 * 60,
    },
  });
}
