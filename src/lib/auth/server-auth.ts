import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';
import { isAuthorizedDeveloperEmail, verifyDeveloperRole } from '@/lib/auth/roles';

export interface VerifiedUser {
  id: string;
  email?: string;
  role?: 'developer' | 'creator' | 'user';
}

/**
 * Resolves the authenticated user from cookies and authorization headers.
 * Supports persistent session tokens, Supabase SSR cookies, and Bearer tokens.
 */
export async function getVerifiedUserFromCookies(): Promise<VerifiedUser | null> {
  let candidateUserId: string | null = null;
  let candidateEmail: string | null = null;

  try {
    const cookieStore = await cookies();

    // 1. Check custom persistent session cookie
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const sessionCheck = await verifySessionExpiryToken(sessionCookie);
      if (sessionCheck.valid && sessionCheck.userId) {
        candidateUserId = sessionCheck.userId;
        candidateEmail = sessionCheck.email || null;
      }
    }

    // 2. Check Supabase auth bearer header if available
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (!candidateUserId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const supabaseAdmin = createAdminClient();
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user?.id) {
        candidateUserId = user.id;
        candidateEmail = user.email || null;
      }
    }

    // 3. Check Supabase SSR session cookie chunks
    if (!candidateUserId) {
      const allCookies = cookieStore.getAll();
      const authCookie = allCookies.find((c) => c.name.includes('-auth-token'));
      if (authCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(authCookie.value));
          const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
          if (accessToken && typeof accessToken === 'string') {
            const supabaseAdmin = createAdminClient();
            const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
            if (user?.id) {
              candidateUserId = user.id;
              candidateEmail = user.email || null;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('User session resolution warning:', err);
  }

  if (!candidateUserId) {
    return null;
  }

  // Determine user role
  let isDev = false;
  if (candidateEmail && isAuthorizedDeveloperEmail(candidateEmail)) {
    isDev = true;
  } else {
    try {
      const devCheck = await verifyDeveloperRole({
        userId: candidateUserId,
        email: candidateEmail || undefined,
      });
      isDev = !!devCheck.isDeveloper;
    } catch {}
  }

  return {
    id: candidateUserId,
    email: candidateEmail || undefined,
    role: isDev ? 'developer' : 'creator',
  };
}
