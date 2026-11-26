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

    // 1. Fetch all platform gifts from Supabase database
    const { data: dbGiftsData, error: gErr } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    if (gErr) {
      console.error('[DEV_GIFTS_API] Error querying gifts from Supabase:', gErr.message);
    }

    // 2. Fetch platform creators & users from both admin_users table and auth.users
    const usersMap = new Map<string, { email?: string; display_name?: string }>();

    try {
      const { data: adminUsers } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, display_name');

      if (adminUsers) {
        for (const u of adminUsers) {
          usersMap.set(u.id, {
            email: u.email,
            display_name: u.display_name || u.email?.split('@')[0],
          });
        }
      }
    } catch (adminErr) {
      console.warn('[DEV_GIFTS_API] admin_users fetch note:', adminErr);
    }

    try {
      const { data: authUsersRes } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsersRes?.users) {
        for (const u of authUsersRes.users) {
          const existing = usersMap.get(u.id);
          usersMap.set(u.id, {
            email: existing?.email || u.email,
            display_name: existing?.display_name || u.user_metadata?.display_name || u.email?.split('@')[0],
          });
        }
      }
    } catch (authErr) {
      console.warn('[DEV_GIFTS_API] auth users list note:', authErr);
    }

    // 3. Unpack database gifts
    const rawDbGifts = dbGiftsData || [];
    const allGiftsMap = new Map<string, any>();

    for (const raw of rawDbGifts) {
      const unpacked = unpackDatabaseGift(raw);
      allGiftsMap.set(unpacked.id, unpacked);
    }

    // 4. Merge any active in-memory gifts (e.g. newly drafted/demo cards in this runtime session)
    for (const memGift of Object.values(MOCK_GIFTS)) {
      if (!allGiftsMap.has(memGift.id)) {
        allGiftsMap.set(memGift.id, memGift);
      }
    }

    const giftsList = Array.from(allGiftsMap.values());

    // 5. Enhance each gift with creator details, status indicators, and public links
    const enhancedGifts = giftsList.map((g: any) => {
      const owner = g.owner_id ? usersMap.get(g.owner_id) : undefined;
      const isExpired =
        g.expiry_enabled &&
        g.expires_at &&
        Date.now() > new Date(g.expires_at).getTime();

      const computedStatus = isExpired
        ? 'expired'
        : g.status === 'archived'
        ? 'archived'
        : g.status === 'draft'
        ? 'draft'
        : 'published';

      return {
        ...g,
        theme: g.selected_theme || 'dreamy',
        owner_email: owner?.email || (g.owner_id ? 'creator@dearyou.com' : 'Anonymous Creator'),
        owner_name: owner?.display_name || (g.owner_id ? 'Creator' : 'Anonymous Creator'),
        status: computedStatus,
        raw_status: g.status || 'published',
        is_expired: isExpired,
        music_type: g.music_source || (g.music_url ? 'library' : 'none'),
        music_title: g.music_title || 'None',
        views_count: typeof g.download_count === 'number' ? g.download_count : 0,
        url: `/gift/${g.slug}`,
        // Safeguard sensitive hashes from list views
        password_hash: undefined,
      };
    });

    // Sort newest first
    enhancedGifts.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      gifts: enhancedGifts,
      totalCount: enhancedGifts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
