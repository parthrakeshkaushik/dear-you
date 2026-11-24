import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';

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

    const { data: usersData } = await supabaseAdmin.from('admin_users').select('*');
    const { data: giftsData } = await supabaseAdmin.from('gifts').select('*');

    const users = usersData && usersData.length > 0 ? usersData : MOCK_USERS;
    const gifts = giftsData && giftsData.length > 0 ? giftsData : Object.values(MOCK_GIFTS);

    const totalUsers = users.length;
    const totalGifts = gifts.length;
    const publishedGifts = gifts.filter((g: any) => g.status === 'published').length;
    const draftGifts = gifts.filter((g: any) => g.status === 'draft').length;
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

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalGifts,
        publishedGifts,
        draftGifts,
        pausedGifts,
        expiredGifts,
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
