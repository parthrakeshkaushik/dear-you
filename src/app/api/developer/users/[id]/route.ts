import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper, logDeveloperAction } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_USERS, MOCK_GIFTS } from '@/lib/mock-data';

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

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch user record
    const { data: userRecord } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const fallbackUser = MOCK_USERS.find((u) => u.id === userId);
    const user = userRecord || fallbackUser;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch gifts owned by this user
    const { data: userGiftsData } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('owner_id', userId);

    const userGifts =
      userGiftsData && userGiftsData.length > 0
        ? userGiftsData
        : Object.values(MOCK_GIFTS).filter((g) => g.owner_id === userId);

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
