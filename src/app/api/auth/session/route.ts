import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  signSessionExpiryToken,
  verifySessionExpiryToken,
  setSessionCookies,
  clearSessionCookies,
  DEFAULT_SESSION_DAYS,
  SESSION_COOKIE_NAME,
  SessionDurationDays,
} from '@/lib/auth/persistent-session';
import { isAuthorizedDeveloperEmail } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/session
 * Establishes or refreshes persistent session cookies with chosen duration (7 or 14 days).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, rememberDays = DEFAULT_SESSION_DAYS } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required to establish session.' }, { status: 400 });
    }

    const validatedDays: SessionDurationDays = rememberDays === 7 ? 7 : 14;

    let userEmail = body.email ? String(body.email).trim().toLowerCase() : undefined;
    let userRole = body.role ? String(body.role).trim().toLowerCase() : undefined;

    // Resolve email and role if omitted
    if (!userEmail || !userRole) {
      try {
        const supabaseAdmin = createAdminClient();
        const { data: adminRecord } = await supabaseAdmin
          .from('admin_users')
          .select('email, role')
          .eq('id', userId)
          .maybeSingle();

        if (adminRecord) {
          if (!userEmail && adminRecord.email) userEmail = adminRecord.email.toLowerCase();
          if (!userRole && adminRecord.role) userRole = adminRecord.role.toLowerCase();
        } else {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (authData?.user) {
            if (!userEmail && authData.user.email) userEmail = authData.user.email.toLowerCase();
            if (!userRole) {
              userRole = authData.user.app_metadata?.role || authData.user.user_metadata?.role || 'creator';
            }
          }
        }
      } catch (lookupErr) {
        console.warn('Identity lookup note in session API:', lookupErr);
      }
    }

    const { token, expiresAt, maxAgeSeconds } = await signSessionExpiryToken(
      userId,
      validatedDays,
      userEmail,
      userRole
    );

    const response = NextResponse.json({
      success: true,
      userId,
      email: userEmail,
      role: userRole,
      rememberDays: validatedDays,
      expiresAt: new Date(expiresAt).toISOString(),
      message: `Persistent session established for ${validatedDays} days.`,
    });

    setSessionCookies(response, token, validatedDays, maxAgeSeconds);

    return response;
  } catch (error: any) {
    console.error('Session establishment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to establish persistent session.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * Checks current session state, remaining lifetime, and expiration status.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // 1. If persistent session cookie is present, verify it
    if (sessionCookie) {
      const check = await verifySessionExpiryToken(sessionCookie);

      if (check.valid && check.userId) {
        const msRemaining = (check.expiresAt || 0) - Date.now();
        const daysRemaining = Math.max(0, Math.round((msRemaining / (24 * 60 * 60 * 1000)) * 10) / 10);

        let displayName: string | null = null;
        try {
          const supabaseAdmin = createAdminClient();
          const { data: userRec } = await supabaseAdmin
            .from('admin_users')
            .select('display_name')
            .eq('id', check.userId)
            .maybeSingle();
          if (userRec?.display_name) {
            displayName = userRec.display_name;
          }
        } catch {}

        const isDev =
          check.role === 'developer' ||
          isAuthorizedDeveloperEmail(check.email);

        return NextResponse.json({
          authenticated: true,
          userId: check.userId,
          email: check.email,
          displayName,
          role: isDev ? 'developer' : check.role,
          rememberDays: check.days,
          expiresAt: new Date(check.expiresAt || 0).toISOString(),
          daysRemaining,
          isDeveloper: isDev,
        });
      }
    }

    // 2. Fallback: Check active Supabase SSR session cookies via createServerClient
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const email = (user.email || '').toLowerCase().trim();
        const isDev =
          isAuthorizedDeveloperEmail(email) ||
          user.app_metadata?.role === 'developer';

        let displayName: string | null =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          null;

        try {
          const supabaseAdmin = createAdminClient();
          const { data: userRec } = await supabaseAdmin
            .from('admin_users')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();
          if (userRec?.display_name) {
            displayName = userRec.display_name;
          }
        } catch {}

        return NextResponse.json({
          authenticated: true,
          userId: user.id,
          email,
          displayName,
          role: isDev ? 'developer' : 'creator',
          rememberDays: 14,
          daysRemaining: 14,
          isDeveloper: isDev,
        });
      }
    } catch (ssrErr) {
      // Non-blocking fallback
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 200 });
  }
}

/**
 * DELETE /api/auth/session (Logout)
 * Clears session cookies and invalidates Supabase sessions.
 */
export async function DELETE(request: NextRequest) {
  try {
    const globalLogout = request.nextUrl.searchParams.get('global') === 'true';
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    const response = NextResponse.json({
      success: true,
      message: globalLogout
        ? 'Logged out from all devices successfully.'
        : 'Logged out successfully.',
    });

    clearSessionCookies(response);

    // If global logout requested, revoke all active sessions in Supabase Auth
    if (globalLogout && sessionCookie) {
      const check = await verifySessionExpiryToken(sessionCookie);
      if (check.userId) {
        try {
          const supabaseAdmin = createAdminClient();
          await supabaseAdmin.auth.admin.signOut(check.userId, 'global');
        } catch (revokeErr) {
          console.warn('Global session revocation note:', revokeErr);
        }
      }
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Logout failed.' }, { status: 500 });
  }
}
