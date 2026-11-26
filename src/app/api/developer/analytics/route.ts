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

    // 1. Fetch users from admin_users and auth.users
    const usersMap = new Map<string, any>();
    try {
      const { data: adminUsers } = await supabaseAdmin.from('admin_users').select('*');
      if (adminUsers) {
        adminUsers.forEach((u: any) => usersMap.set(u.id, u));
      }
    } catch {}

    try {
      const { data: authUsersRes } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsersRes?.users) {
        authUsersRes.users.forEach((u: any) => {
          if (!usersMap.has(u.id)) {
            usersMap.set(u.id, { id: u.id, email: u.email, account_status: 'active' });
          }
        });
      }
    } catch {}

    // 2. Fetch gifts from database
    const { data: giftsData } = await supabaseAdmin.from('gifts').select('*');

    // Merge database gifts and memory gifts
    const giftsMap = new Map<string, any>();
    if (giftsData) {
      giftsData.forEach((row: any) => {
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
    const totalUsers = usersMap.size;
    const totalGifts = gifts.length;
    const publishedGifts = gifts.filter((g: any) => g.status === 'published').length;
    const draftGifts = gifts.filter((g: any) => g.status === 'draft').length;
    const archivedGifts = gifts.filter((g: any) => g.status === 'archived').length;
    const pausedGifts = gifts.filter((g: any) => g.moderation_status === 'paused').length;
    const expiredGifts = gifts.filter((g: any) => {
      return g.expiry_enabled && g.expires_at && Date.now() > new Date(g.expires_at).getTime();
    }).length;

    // Theme counts
    const themeCounts: Record<string, number> = {};
    gifts.forEach((g: any) => {
      const theme = g.selected_theme || 'dreamy';
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    // Event type counts
    const eventCounts: Record<string, number> = {};
    gifts.forEach((g: any) => {
      const evt = g.event_type || 'Birthday';
      eventCounts[evt] = (eventCounts[evt] || 0) + 1;
    });

    const totalPhotos = gifts.reduce((acc: number, g: any) => acc + (Array.isArray(g.memories) ? g.memories.length : 0), 0);

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalGifts,
        publishedGifts,
        draftGifts,
        archivedGifts,
        pausedGifts,
        expiredGifts,
        totalPhotos,
        themeCounts,
        eventCounts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
