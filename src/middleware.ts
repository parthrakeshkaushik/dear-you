import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  verifySessionExpiryToken,
  clearSessionCookies,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/developer');
  const isAuthRoute = pathname === '/login';

  // 1. Validate custom persistent session expiry token
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let hasValidPersistentSession = false;
  let isSessionExpired = false;
  let sessionUserId: string | null = null;

  if (sessionCookie) {
    const check = await verifySessionExpiryToken(sessionCookie);
    if (check.valid) {
      hasValidPersistentSession = true;
      sessionUserId = check.userId || null;
    } else if (check.expired) {
      isSessionExpired = true;
    }
  }

  // 2. Check Supabase auth session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  let hasSupabaseUser = false;
  let supabaseUserEmail = '';

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      hasSupabaseUser = true;
      supabaseUserEmail = user.email || '';
    }
  } catch (err) {
    // Supabase auth client check failure (e.g. invalid cookie signature or offline)
  }

  // 3. Protected Routes Gatekeeper (/admin and /developer)
  if (isProtectedRoute) {
    // If the configured session duration (7 or 14 days) has expired
    if (isSessionExpired) {
      const redirectUrl = new URL('/login?expired=true', request.url);
      const redirectRes = NextResponse.redirect(redirectUrl);
      clearSessionCookies(redirectRes);
      return redirectRes;
    }

    // If neither Supabase user nor persistent session token exists
    if (!hasSupabaseUser && !hasValidPersistentSession) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4. Auth Route Redirect (/login)
  // If user already has an active, valid session, do not repeatedly show login screens
  if (isAuthRoute) {
    const isExplicitExpired = request.nextUrl.searchParams.get('expired') === 'true';
    const isExplicitLoggedOut = request.nextUrl.searchParams.get('logged_out') === 'true';

    if (!isExplicitExpired && !isExplicitLoggedOut) {
      if ((hasSupabaseUser || hasValidPersistentSession) && !isSessionExpired) {
        const isDev =
          supabaseUserEmail.includes('dev') ||
          supabaseUserEmail.includes('owner');
        const targetUrl = new URL(isDev ? '/developer' : '/admin', request.url);
        return NextResponse.redirect(targetUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/developer/:path*',
    '/login',
  ],
};
