import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  clearSessionCookies,
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';

export async function POST(request: NextRequest) {
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
