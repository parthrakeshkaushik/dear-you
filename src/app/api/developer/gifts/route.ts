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

    // 1. Fetch all gifts
    const { data: giftsData, error: gErr } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fetch users to map owner details
    const { data: usersData } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, display_name');

    const usersMap = new Map<string, any>();
    if (usersData) {
      for (const u of usersData) {
        usersMap.set(u.id, u);
      }
    }
    for (const mu of MOCK_USERS) {
      if (!usersMap.has(mu.id)) {
        usersMap.set(mu.id, mu);
      }
    }

    let gifts = giftsData || [];
    if (gifts.length === 0) {
      gifts = Object.values(MOCK_GIFTS);
    }

    const enhancedGifts = gifts.map((g: any) => {
      const owner = usersMap.get(g.owner_id);
      return {
        ...g,
        owner_email: owner?.email || 'unknown@example.com',
        owner_name: owner?.display_name || 'Creator',
        // Never return actual password hashes or passwords in list endpoints
        password_hash: undefined,
      };
    });

    return NextResponse.json({ gifts: enhancedGifts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
