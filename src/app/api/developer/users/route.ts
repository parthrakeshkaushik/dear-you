import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth/roles';
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

    const { data: usersData, error: uErr } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (uErr) {
      console.error('[DEV_USERS_API] Error querying admin_users:', uErr.message);
      return NextResponse.json(
        { error: 'Failed to retrieve registered users from database.' },
        { status: 500 }
      );
    }

    // Also get gift counts per user
    const { data: giftsData } = await supabaseAdmin
      .from('gifts')
      .select('id, owner_id, status');

    const giftCountsByOwner: Record<string, { total: number; published: number; draft: number }> = {};
    if (giftsData) {
      for (const g of giftsData) {
        if (!g.owner_id) continue;
        if (!giftCountsByOwner[g.owner_id]) {
          giftCountsByOwner[g.owner_id] = { total: 0, published: 0, draft: 0 };
        }
        giftCountsByOwner[g.owner_id].total++;
        if (g.status === 'published') giftCountsByOwner[g.owner_id].published++;
        else if (g.status === 'draft') giftCountsByOwner[g.owner_id].draft++;
      }
    }

    const users = usersData || [];

    const enhancedUsers = users.map((u: any) => {
      const counts = giftCountsByOwner[u.id] || {
        total: u.gifts_count || 0,
        published: u.published_count || 0,
        draft: u.draft_count || 0,
      };
      return {
        ...u,
        gifts_count: counts.total,
        published_count: counts.published,
        draft_count: counts.draft,
      };
    });

    return NextResponse.json({ users: enhancedUsers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
