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

/**
 * Checks if the user is an authorized platform developer/super admin.
 * Evaluates authenticated email, Supabase app_metadata, and cryptographically verified session token role.
 */
function isDevUser(
  email?: string | null,
  appMeta?: Record<string, any>,
  sessionRole?: string | null
): boolean {
  const clean = (email || '').trim().toLowerCase();
  const isEmailMatch = AUTHORIZED_DEVELOPER_EMAILS.some((dev) => dev.toLowerCase() === clean);
  const isRoleMatch =
    appMeta?.role === 'developer' ||
    appMeta?.is_super_admin === true ||
    sessionRole === 'developer';
  return isEmailMatch || isRoleMatch;
}

/**
 * Creates a redirect response that preserves all modified and refreshed cookies.
 * Essential for Next.js middleware with @supabase/ssr so tokens are never lost.
 */
function makeRedirectWithCookies(url: URL | string, sourceResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirectResponse;
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

  // 1. Validate custom persistent session expiry token (cryptographically signed)
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let hasValidPersistentSession = false;
  let isSessionExpired = false;
  let sessionUserId: string | null = null;
  let sessionUserEmail: string | null = null;
  let sessionUserRole: string | null = null;

  if (sessionCookie) {
    const check = await verifySessionExpiryToken(sessionCookie);
    if (check.valid) {
      hasValidPersistentSession = true;
      sessionUserId = check.userId || null;
      sessionUserEmail = check.email || null;
      sessionUserRole = check.role || null;
    } else if (check.expired) {
      isSessionExpired = true;
    }
  }

  // 2. Check Supabase auth session with chunked cookie support
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
  } catch {
    // Non-blocking fallback for offline or network latency
  }

  // 3. Protected Routes Gatekeeper (/admin and /developer)
  if (isProtectedRoute) {
    // If the configured session duration has expired
    if (isSessionExpired) {
      const redirectUrl = new URL('/login?expired=true', request.url);
      const redirectRes = makeRedirectWithCookies(redirectUrl, response);
      clearSessionCookies(redirectRes);
      return redirectRes;
    }

    // If neither Supabase user nor verified persistent session exists
    if (!hasSupabaseUser && !hasValidPersistentSession) {
      const redirectUrl = new URL('/login', request.url);
      return makeRedirectWithCookies(redirectUrl, response);
    }

    // Strict Role-Based Server-Side Enforcement for /developer routes
    if (pathname.startsWith('/developer')) {
      const effectiveEmail = supabaseUserEmail || sessionUserEmail;
      const isAuthorizedDev = isDevUser(effectiveEmail, supabaseUserAppMetadata, sessionUserRole);
      if (!isAuthorizedDev) {
        // Unauthorized creator attempting to access /developer directly is redirected to /admin
        const forbiddenUrl = new URL('/admin?unauthorized=true', request.url);
        return makeRedirectWithCookies(forbiddenUrl, response);
      }
    }
  }

  // 4. Auth Route Redirect (/login)
  // If user already has an active, valid session, smoothly direct them to their console
  if (isAuthRoute) {
    const isExplicitExpired = request.nextUrl.searchParams.get('expired') === 'true';
    const isExplicitLoggedOut = request.nextUrl.searchParams.get('logged_out') === 'true';

    if (!isExplicitExpired && !isExplicitLoggedOut) {
      if ((hasSupabaseUser || hasValidPersistentSession) && !isSessionExpired) {
        const effectiveEmail = supabaseUserEmail || sessionUserEmail;
        const isDev = isDevUser(effectiveEmail, supabaseUserAppMetadata, sessionUserRole);
        const targetUrl = new URL(isDev ? '/developer' : '/admin', request.url);
        return makeRedirectWithCookies(targetUrl, response);
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
