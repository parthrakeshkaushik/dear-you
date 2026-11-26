import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { unpackDatabaseGift } from '@/app/api/gifts/route';
import { MOCK_GIFTS } from '@/lib/mock-data';

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

    // 1. Fetch live users from both admin_users and auth.users
    const usersMap = new Map<string, any>();

    try {
      const { data: usersData } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData) {
        usersData.forEach((u: any) => usersMap.set(u.id, u));
      }
    } catch {}

    try {
      const { data: authUsersRes } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsersRes?.users) {
        authUsersRes.users.forEach((u: any) => {
          if (!usersMap.has(u.id)) {
            usersMap.set(u.id, {
              id: u.id,
              email: u.email,
              display_name: u.user_metadata?.display_name || u.email?.split('@')[0],
              account_status: 'active',
              created_at: u.created_at,
            });
          }
        });
      }
    } catch {}

    // 2. Fetch live gifts from Supabase database
    const { data: dbGiftsData } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch recent audit logs
    const { data: auditData } = await supabaseAdmin
      .from('developer_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const auditLogs = auditData || [];

    // Merge database and memory gifts
    const giftsMap = new Map<string, any>();
    if (dbGiftsData) {
      dbGiftsData.forEach((row: any) => {
        const unpacked = unpackDatabaseGift(row);
        giftsMap.set(unpacked.id, unpacked);
      });
    }

    for (const memGift of Object.values(MOCK_GIFTS)) {
      if (!giftsMap.has(memGift.id)) {
        giftsMap.set(memGift.id, memGift);
      }
    }

    const gifts = Array.from(giftsMap.values());
    const users = Array.from(usersMap.values());

    const enhancedGifts = gifts.map((g: any) => {
      const owner = g.owner_id ? usersMap.get(g.owner_id) : undefined;
      return {
        ...g,
        owner_name: owner?.display_name || (g.owner_id ? 'Creator' : 'Anonymous Creator'),
        owner_email: owner?.email || (g.owner_id ? 'creator@dearyou.com' : ''),
      };
    });

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.account_status === 'active').length;
    const totalGifts = gifts.length;
    const publishedGifts = gifts.filter((g: any) => g.status === 'published').length;
    const draftGifts = gifts.filter((g: any) => g.status === 'draft').length;
    const archivedGifts = gifts.filter((g: any) => g.status === 'archived').length;
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
        archivedGifts,
        expiredGifts,
        themeCounts,
      },
      recentGifts: enhancedGifts.slice(0, 5),
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
