import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';
import { isAuthorizedDeveloperEmail } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * Extracts authenticated user identity from session cookies or authorization header.
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{
  userId: string;
  sessionEmail?: string;
  sessionRole?: string;
} | null> {
  // 1. Check custom persistent session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const check = await verifySessionExpiryToken(sessionCookie);
    if (check.valid && check.userId) {
      return {
        userId: check.userId,
        sessionEmail: check.email,
        sessionRole: check.role,
      };
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const supabaseAdmin = createAdminClient();
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user?.id) {
        return {
          userId: user.id,
          sessionEmail: user.email,
          sessionRole: user.app_metadata?.role,
        };
      }
    } catch {
      // Non-blocking
    }
  }

  return null;
}

/**
 * GET /api/auth/profile
 * Returns the currently authenticated user's genuine profile details.
 * Strictly uses authenticated Supabase/database session as the source of truth.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view your profile.' },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const userId = auth.userId;

    // 1. Fetch from admin_users profile table
    const { data: dbUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, display_name, role, account_status, created_at')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch from Supabase Auth identity
    let authUser: any = null;
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      authUser = data?.user || null;
    } catch (authLookupErr) {
      console.warn('Supabase Auth user lookup note:', authLookupErr);
    }

    const email = (
      dbUser?.email ||
      authUser?.email ||
      auth.sessionEmail ||
      ''
    ).toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Account email could not be resolved.' },
        { status: 404 }
      );
    }

    const isDeveloper =
      isAuthorizedDeveloperEmail(email) ||
      dbUser?.role === 'developer' ||
      authUser?.app_metadata?.role === 'developer' ||
      auth.sessionRole === 'developer';

    const displayName =
      dbUser?.display_name ||
      authUser?.user_metadata?.display_name ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      null;

    const avatarUrl =
      authUser?.user_metadata?.avatar_url ||
      authUser?.user_metadata?.picture ||
      null;

    const createdAt = dbUser?.created_at || authUser?.created_at || null;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        displayName,
        role: isDeveloper ? 'developer' : 'creator',
        accountType: isDeveloper ? 'Developer' : 'Creator',
        accountStatus: dbUser?.account_status || 'active',
        avatarUrl,
        createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/auth/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 * Updates the user's editable profile information (Full Name / Display Name).
 * Email modification is prohibited here — email changes must follow Supabase's secure verification flow.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth || !auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to update profile.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, email: attemptedEmailChange } = body;

    // Disallow arbitrary email tampering
    if (attemptedEmailChange) {
      return NextResponse.json(
        {
          error:
            'Authenticated email address cannot be changed directly. Please use the secure email change and verification procedure.',
        },
        { status: 400 }
      );
    }

    const trimmedName = typeof displayName === 'string' ? displayName.trim() : '';
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Full name cannot be blank.' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 70) {
      return NextResponse.json(
        { error: 'Full name must be 70 characters or fewer.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const userId = auth.userId;

    // 1. Update admin_users record
    const { error: dbErr } = await supabaseAdmin
      .from('admin_users')
      .update({ display_name: trimmedName })
      .eq('id', userId);

    if (dbErr) {
      console.warn('admin_users update note:', dbErr);
    }

    // 2. Update Supabase Auth metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          display_name: trimmedName,
          full_name: trimmedName,
        },
      });
    } catch (metaErr) {
      console.warn('Supabase Auth metadata update note:', metaErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      displayName: trimmedName,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/auth/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile.' },
      { status: 500 }
    );
  }
}
