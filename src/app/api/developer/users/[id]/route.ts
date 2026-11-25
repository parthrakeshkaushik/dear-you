import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper, logDeveloperAction } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authCheck = await getAuthenticatedDeveloper(request);
  if (!authCheck.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Platform Developer access required' },
      { status: 403 }
    );
  }

  const userId = params.id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch user record from admin_users
    let { data: userRecord, error: uErr } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (uErr) {
      console.error('[DEV_USER_DETAIL_API] Error looking up admin_users:', uErr.message);
    }

    // Fallback check against Supabase Auth users if not yet in admin_users
    if (!userRecord) {
      try {
        const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUserData?.user) {
          const authUser = authUserData.user;
          userRecord = {
            id: authUser.id,
            email: authUser.email || '',
            display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Registered User',
            role: 'creator',
            registration_method: authUser.phone ? 'mobile' : 'email',
            account_status: 'active',
            email_verified: Boolean(authUser.email_confirmed_at),
            phone_verified: Boolean(authUser.phone_confirmed_at),
            created_at: authUser.created_at,
            last_active_at: authUser.last_sign_in_at || authUser.created_at,
          };
        }
      } catch (authErr: any) {
        console.warn('[DEV_USER_DETAIL_API] Auth user lookup note:', authErr?.message);
      }
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const user = userRecord;

    // 2. Fetch gifts owned by this user
    const { data: userGiftsData } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('owner_id', userId);

    const userGifts = userGiftsData || [];

    // 3. Fetch policy acceptances
    const { data: policyData } = await supabaseAdmin
      .from('policy_acceptances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Log the inspection action
    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType: 'view_user_profile',
      targetUserId: userId,
      details: { inspectedEmail: user.email },
    });

    return NextResponse.json({
      user: {
        ...user,
        terms_version: policyData?.terms_version || user.terms_version || 'v1.0',
        terms_accepted_at: policyData?.terms_accepted_at || user.terms_accepted_at || user.created_at,
        privacy_policy_version: policyData?.privacy_policy_version || user.privacy_policy_version || 'v1.0',
        privacy_policy_accepted_at: policyData?.privacy_policy_accepted_at || user.privacy_policy_accepted_at || user.created_at,
      },
      gifts: userGifts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authCheck = await getAuthenticatedDeveloper(request);
  if (!authCheck.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Platform Developer access required' },
      { status: 403 }
    );
  }

  const userId = params.id;
  const body = await request.json();
  const { account_status, suspension_reason } = body;

  if (account_status !== 'active' && account_status !== 'suspended') {
    return NextResponse.json(
      { error: 'Invalid account status. Must be active or suspended.' },
      { status: 400 }
    );
  }

  try {
    const supabaseAdmin = createAdminClient();

    const updatePayload: Record<string, any> = {
      account_status,
      suspended_at: account_status === 'suspended' ? new Date().toISOString() : null,
      suspension_reason: account_status === 'suspended' ? (suspension_reason || 'Administrative action') : null,
    };

    const { data: updated, error } = await supabaseAdmin
      .from('admin_users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    // Record audit log
    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType: account_status === 'suspended' ? 'user_suspended' : 'user_reactivated',
      targetUserId: userId,
      details: {
        newStatus: account_status,
        reason: suspension_reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
      status: account_status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
