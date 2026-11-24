import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  verifySessionExpiryToken,
  clearSessionCookies,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';

const AUTHORIZED_DEVELOPER_EMAILS = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
];

function isDevUser(email?: string | null, appMeta?: Record<string, any>): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const isEmailMatch = AUTHORIZED_DEVELOPER_EMAILS.some((dev) => dev.toLowerCase() === clean);
  const isRoleMatch = appMeta?.role === 'developer' || appMeta?.is_super_admin === true;
  return isEmailMatch || isRoleMatch;
}

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
  let supabaseUserAppMetadata: Record<string, any> = {};

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
      supabaseUserAppMetadata = user.app_metadata || {};
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

    // Strict Role-Based Server-Side Enforcement for /developer routes
    if (pathname.startsWith('/developer')) {
      const isAuthorizedDev = isDevUser(supabaseUserEmail, supabaseUserAppMetadata);
      if (!isAuthorizedDev) {
        // Ordinary user attempting to access /developer directly via URL is blocked
        const forbiddenUrl = new URL('/admin?unauthorized=true', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  // 4. Auth Route Redirect (/login)
  // If user already has an active, valid session, do not repeatedly show login screens
  if (isAuthRoute) {
    const isExplicitExpired = request.nextUrl.searchParams.get('expired') === 'true';
    const isExplicitLoggedOut = request.nextUrl.searchParams.get('logged_out') === 'true';

    if (!isExplicitExpired && !isExplicitLoggedOut) {
      if ((hasSupabaseUser || hasValidPersistentSession) && !isSessionExpired) {
        const isDev = isDevUser(supabaseUserEmail, supabaseUserAppMetadata);
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
