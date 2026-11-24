import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_USERS, MOCK_GIFTS, MOCK_AUDIT_LOGS } from '@/lib/mock-data';

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

    // 1. Fetch live users from admin_users
    const { data: usersData } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fetch live gifts
    const { data: giftsData } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch recent audit logs
    const { data: auditData } = await supabaseAdmin
      .from('developer_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const users = usersData && usersData.length > 0 ? usersData : MOCK_USERS;
    const gifts = giftsData && giftsData.length > 0 ? giftsData : Object.values(MOCK_GIFTS);
    const auditLogs = auditData && auditData.length > 0 ? auditData : MOCK_AUDIT_LOGS;

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.account_status === 'active').length;
    const totalGifts = gifts.length;
    const publishedGifts = gifts.filter((g: any) => g.status === 'published').length;
    const draftGifts = gifts.filter((g: any) => g.status === 'draft').length;
    const expiredGifts = gifts.filter((g: any) => {
      return g.expiry_enabled && g.expires_at && Date.now() > new Date(g.expires_at).getTime();
    }).length;

    const themeCounts: Record<string, number> = {};
    gifts.forEach((g: any) => {
      const theme = g.selected_theme || 'dreamy';
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        totalGifts,
        publishedGifts,
        draftGifts,
        expiredGifts,
        themeCounts,
      },
      recentGifts: gifts.slice(0, 5),
      recentAuditLogs: auditLogs.slice(0, 8),
      developerEmail: authCheck.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
