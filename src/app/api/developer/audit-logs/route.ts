import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper, logDeveloperAction } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const authCheck = await getAuthenticatedDeveloper(request);
  if (!authCheck.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Platform Developer access required' },
      { status: 403 }
    );
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { data: logsData, error } = await supabaseAdmin
      .from('developer_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const logs = logsData || [];

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await getAuthenticatedDeveloper(request);
  if (!authCheck.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Platform Developer access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { actionType, targetUserId, targetGiftId, details } = body;

    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType,
      targetUserId,
      targetGiftId,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
