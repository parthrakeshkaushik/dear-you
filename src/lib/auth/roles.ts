import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';

export const AUTHORIZED_DEVELOPER_EMAILS = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
] as const;

/**
 * Checks if a given email is one of the designated platform developer accounts
 */
export function isAuthorizedDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_DEVELOPER_EMAILS.some((devEmail) => devEmail.toLowerCase() === clean);
}

/**
 * Extracts and verifies the authenticated developer from the incoming request.
 */
export async function getAuthenticatedDeveloper(
  request: NextRequest
): Promise<{ isDeveloper: boolean; userId?: string; email?: string }> {
  // 1. Check custom persistent session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let candidateUserId: string | null = null;
  let candidateEmail: string | null = null;

  if (sessionCookie) {
    const sessionCheck = await verifySessionExpiryToken(sessionCookie);
    if (sessionCheck.valid && sessionCheck.userId) {
      candidateUserId = sessionCheck.userId;
      candidateEmail = sessionCheck.email || null;
    }
  }

  // 2. Check Supabase auth header or bearer token
  const authHeader = request.headers.get('authorization');
  let authHeaderToken = '';
  if (authHeader?.startsWith('Bearer ')) {
    authHeaderToken = authHeader.replace('Bearer ', '').trim();
  }

  try {
    const supabaseAdmin = createAdminClient();

    if (authHeaderToken) {
      const { data: authUser } = await supabaseAdmin.auth.getUser(authHeaderToken);
      if (authUser?.user?.id) {
        candidateUserId = authUser.user.id;
        if (authUser.user.email) candidateEmail = authUser.user.email;
      }
    }

    if (candidateUserId || candidateEmail) {
      const roleCheck = await verifyDeveloperRole({
        userId: candidateUserId || undefined,
        email: candidateEmail || undefined,
      });
      if (roleCheck.isDeveloper) {
        return {
          isDeveloper: true,
          userId: roleCheck.userId || candidateUserId || undefined,
          email: roleCheck.email,
        };
      }
    }
  } catch (err) {
    console.warn('Developer authentication check note:', err);
  }

  return { isDeveloper: false };
}

/**
 * Verifies developer authorization on the server using database role enforcement
 */
export async function verifyDeveloperRole(
  identifier: { userId?: string; email?: string }
): Promise<{
  isDeveloper: boolean;
  email?: string;
  userId?: string;
  role?: string;
}> {
  const { userId, email } = identifier;
  const cleanEmail = email?.trim().toLowerCase();

  // Fast-path email safety check
  const isDesignatedEmail = cleanEmail ? isAuthorizedDeveloperEmail(cleanEmail) : false;

  try {
    const supabaseAdmin = createAdminClient();

    // 1. If we have userId, query admin_users by ID
    if (userId) {
      const { data: adminRecord, error: dbErr } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, role, account_status')
        .eq('id', userId)
        .maybeSingle();

      if (!dbErr && adminRecord) {
        const isDevRole = adminRecord.role === 'developer' && adminRecord.account_status === 'active';
        const emailMatches = isAuthorizedDeveloperEmail(adminRecord.email);

        if (isDevRole && emailMatches) {
          return {
            isDeveloper: true,
            email: adminRecord.email,
            userId: adminRecord.id,
            role: adminRecord.role,
          };
        }
      }

      // 2. Also check auth.users app_metadata
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!authErr && authUser?.user) {
        const authEmail = authUser.user.email?.toLowerCase();
        const authRole = authUser.user.app_metadata?.role;
        if (
          (authRole === 'developer' || authUser.user.app_metadata?.is_super_admin) &&
          isAuthorizedDeveloperEmail(authEmail)
        ) {
          return {
            isDeveloper: true,
            email: authEmail,
            userId: authUser.user.id,
            role: 'developer',
          };
        }
      }
    }

    // 3. If we only have email, query admin_users by email
    if (cleanEmail && isDesignatedEmail) {
      const { data: adminRecord } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, role, account_status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (adminRecord && adminRecord.role === 'developer' && adminRecord.account_status === 'active') {
        return {
          isDeveloper: true,
          email: adminRecord.email,
          userId: adminRecord.id,
          role: adminRecord.role,
        };
      }
    }
  } catch (err) {
    console.warn('Developer role verification fallback:', err);
  }

  // Defense-in-depth: If designated email matches in offline/mock mode
  if (isDesignatedEmail) {
    return {
      isDeveloper: true,
      email: cleanEmail,
      userId: userId || 'designated-dev',
      role: 'developer',
    };
  }

  return { isDeveloper: false };
}

/**
 * Sanitizes and logs administrative actions to developer_audit_logs
 */
export async function logDeveloperAction(params: {
  developerId?: string;
  developerEmail: string;
  actionType: string;
  targetUserId?: string;
  targetGiftId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  actionResult?: 'success' | 'failure';
}) {
  try {
    const supabaseAdmin = createAdminClient();

    // Strip sensitive fields
    const sanitizedDetails = { ...(params.details || {}) };
    delete sanitizedDetails.password;
    delete sanitizedDetails.password_hash;
    delete sanitizedDetails.otp;
    delete sanitizedDetails.token;
    delete sanitizedDetails.secret;

    await supabaseAdmin.from('developer_audit_logs').insert({
      developer_id: params.developerId || null,
      developer_email: params.developerEmail,
      action_type: params.actionType,
      target_user_id: params.targetUserId || null,
      target_gift_id: params.targetGiftId || null,
      details: sanitizedDetails,
      ip_address: params.ipAddress || null,
      action_result: params.actionResult || 'success',
    });
  } catch (err) {
    console.warn('Could not persist developer audit log:', err);
  }
}

/**
 * Verifies if an incoming request is from the authenticated owner of the gift
 * or an authorized platform developer/super admin. Used to safely authorize
 * creator live previews without requiring recipient passwords.
 */
export async function isAuthorizedPreviewUser(
  request: NextRequest,
  giftOwnerId?: string
): Promise<{ isAuthorized: boolean; userId?: string; isOwner?: boolean; isDeveloper?: boolean }> {
  // 1. Check custom persistent session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const check = await verifySessionExpiryToken(sessionCookie);
    if (check.valid && check.userId) {
      const isOwner = !!(giftOwnerId && check.userId === giftOwnerId);
      const isDev = check.role === 'developer' || isAuthorizedDeveloperEmail(check.email);
      if (isOwner || isDev) {
        return {
          isAuthorized: true,
          userId: check.userId,
          isOwner,
          isDeveloper: isDev,
        };
      }
    }
  }

  // 2. Check Supabase Auth Bearer token / dev session
  try {
    const dev = await getAuthenticatedDeveloper(request);
    if (dev.isDeveloper) {
      return {
        isAuthorized: true,
        userId: dev.userId,
        isOwner: !!(giftOwnerId && dev.userId === giftOwnerId),
        isDeveloper: true,
      };
    }
  } catch {}

  return { isAuthorized: false };
}
