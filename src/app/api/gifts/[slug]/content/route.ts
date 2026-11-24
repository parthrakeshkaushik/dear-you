import { NextRequest, NextResponse } from 'next/server';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { checkGiftExpiry } from '@/lib/expiry';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const gift = MOCK_GIFTS[slug];

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // 1. Check Moderation & Deletion Status
    if (gift.moderation_status === 'deleted' || gift.deleted_at) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    if (
      gift.moderation_status === 'paused' ||
      gift.moderation_status === 'unpublished' ||
      gift.status !== 'published'
    ) {
      return NextResponse.json(
        {
          isUnavailable: true,
          message:
            'This gift is currently unavailable. Please contact the person who shared this gift with you.',
          selected_theme: gift.selected_theme,
          theme_config: gift.theme_config,
        },
        { status: 423 }
      );
    }

    // 2. Check Creator Account Status
    const owner = MOCK_USERS.find((u) => u.id === gift.owner_id);
    if (owner && owner.account_status === 'suspended') {
      return NextResponse.json(
        {
          isUnavailable: true,
          message:
            'This gift is currently unavailable. Please contact the person who shared this gift with you.',
          selected_theme: gift.selected_theme,
          theme_config: gift.theme_config,
        },
        { status: 423 }
      );
    }

    // 3. Check Expiry
    const expiry = checkGiftExpiry(gift.expiry_enabled, gift.expires_at, gift.expiry_timezone);
    if (expiry.isExpired) {
      // Never serve sensitive content after expiry! Only return closure data.
      return NextResponse.json(
        {
          isExpired: true,
          recipient_name: gift.recipient_name,
          selected_theme: gift.selected_theme,
          theme_config: gift.theme_config,
          expiry_heading: gift.expiry_heading,
          expiry_message: gift.expiry_message,
        },
        { status: 410 }
      );
    }

    // 4. Check Recipient Session Cookie
    const cookieName = getRecipientCookieName(slug);
    const token = request.cookies.get(cookieName)?.value;

    let hasAccess = false;
    if (token) {
      hasAccess = await verifyRecipientToken(token, gift.id);
    }

    // Check query for preview if authorized
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';

    if (!hasAccess && !isPreview) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Gift is password protected',
          requiresPassword: true,
          hint: gift.password_hint,
        },
        { status: 401 }
      );
    }

    // Strip password hash from public delivery
    const { password_hash, ...safeGiftData } = gift;

    return NextResponse.json({
      success: true,
      gift: safeGiftData,
    });
  } catch (error) {
    console.error('Content retrieval error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred' },
      { status: 500 }
    );
  }
}
