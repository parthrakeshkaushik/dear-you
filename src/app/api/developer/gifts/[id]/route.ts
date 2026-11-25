import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper, logDeveloperAction } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { getGiftWithChildCollections } from '@/lib/gifts/fetch-gift';

interface RouteContext {
  params: {
    id: string; // can be gift ID or slug
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

  const giftIdOrSlug = params.id;

  try {
    const supabaseAdmin = createAdminClient();

    // Query gift by ID or slug
    let query = supabaseAdmin.from('gifts').select('*');
    if (giftIdOrSlug.includes('-') && giftIdOrSlug.length > 20) {
      query = query.or(`id.eq.${giftIdOrSlug},slug.eq.${giftIdOrSlug}`);
    } else {
      query = query.eq('slug', giftIdOrSlug);
    }

    const { data: giftRecord } = await query.maybeSingle();

    let gift = await getGiftWithChildCollections(giftIdOrSlug);
    if (!gift && giftRecord) {
      gift = giftRecord as any;
    }

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // Fetch owner details
    let owner = null;
    if (gift.owner_id) {
      const { data: ownerData } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, display_name, account_status')
        .eq('id', gift.owner_id)
        .maybeSingle();
      owner = ownerData || MOCK_USERS.find((u) => u.id === gift.owner_id);
    }

    // Log the inspection action
    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType: 'inspect_gift_content',
      targetGiftId: gift.id,
      details: {
        slug: gift.slug,
        title: gift.title,
        recipient: gift.recipient_name,
      },
    });

    // Strip sensitive password hash before returning
    const sanitizedGift = {
      ...gift,
      password_hash: undefined,
      owner,
    };

    return NextResponse.json({ gift: sanitizedGift });
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

  const giftIdOrSlug = params.id;
  const body = await request.json();
  const { action, reason } = body;

  try {
    const supabaseAdmin = createAdminClient();

    let updatePayload: Record<string, any> = {
      moderated_by: authCheck.userId,
      moderated_at: new Date().toISOString(),
    };

    let actionType = 'moderation_action';

    switch (action) {
      case 'pause':
        updatePayload.moderation_status = 'paused';
        updatePayload.moderation_reason = reason || 'Paused by platform developer';
        actionType = 'gift_paused';
        break;

      case 'resume':
        updatePayload.moderation_status = 'active';
        updatePayload.moderation_reason = null;
        actionType = 'gift_unpaused';
        break;

      case 'unpublish':
        updatePayload.moderation_status = 'unpublished';
        updatePayload.moderation_reason = reason || 'Unpublished by platform developer';
        actionType = 'gift_unpublished';
        break;

      case 'delete':
        updatePayload.moderation_status = 'deleted';
        updatePayload.deleted_at = new Date().toISOString();
        updatePayload.deleted_by = authCheck.userId;
        updatePayload.deletion_reason = reason || 'Soft-deleted by developer moderation';
        actionType = 'gift_deleted';
        break;

      case 'restore':
        updatePayload.moderation_status = 'active';
        updatePayload.deleted_at = null;
        updatePayload.deleted_by = null;
        updatePayload.deletion_reason = null;
        actionType = 'gift_restored';
        break;

      default:
        return NextResponse.json(
          { error: `Invalid moderation action: ${action}` },
          { status: 400 }
        );
    }

    // Determine whether to match by ID or slug
    let query = supabaseAdmin.from('gifts').update(updatePayload);
    if (giftIdOrSlug.includes('-') && giftIdOrSlug.length > 20) {
      query = query.or(`id.eq.${giftIdOrSlug},slug.eq.${giftIdOrSlug}`);
    } else {
      query = query.eq('slug', giftIdOrSlug);
    }

    const { data: updated, error } = await query.select().maybeSingle();

    // Log the moderation action
    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType,
      targetGiftId: updated?.id || giftIdOrSlug,
      details: {
        action,
        reason: reason || null,
        slug: updated?.slug || giftIdOrSlug,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      gift: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
