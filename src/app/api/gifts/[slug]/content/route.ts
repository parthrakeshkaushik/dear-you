import { NextRequest, NextResponse } from 'next/server';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { isAuthorizedPreviewUser } from '@/lib/auth/roles';
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

    // 4. Check Recipient Session Cookie with Password Version Revalidation
    const cookieName = getRecipientCookieName(slug);
    const token = request.cookies.get(cookieName)?.value;

    let hasAccess = false;
    let isPasswordRevoked = false;

    if (token) {
      const authCheck = await verifyRecipientToken(
        token,
        gift.id,
        gift.password_version || 1
      );
      hasAccess = authCheck.valid;
      isPasswordRevoked = !!authCheck.passwordRevoked;
    }

    // Check query for preview if authorized (Creator/Developer ownership verification)
    const wantsPreview = request.nextUrl.searchParams.get('preview') === 'true';
    let isAuthorizedPreview = false;
    if (wantsPreview) {
      const authPreview = await isAuthorizedPreviewUser(request, gift.owner_id);
      isAuthorizedPreview = authPreview.isAuthorized;
    }

    const isDemo = gift.is_demo === true || slug === 'demo' || slug === 'demo-gift';

    if (!hasAccess && !isAuthorizedPreview && !isDemo) {
      const response = NextResponse.json(
        {
          error: isPasswordRevoked
            ? 'The card password has been updated. Please enter the new password to continue.'
            : 'Unauthorized: Gift is password protected',
          requiresPassword: true,
          passwordRevoked: isPasswordRevoked,
          isDemo,
          hint: isDemo ? 'special' : undefined,
        },
        { status: 401 }
      );

      // Invalidate existing stale cookie immediately
      if (isPasswordRevoked) {
        response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
      }

      return response;
    }

    // Strip password hash from public delivery
    const { password_hash, ...safeGiftData } = gift;

    // Secure password hint policy: Only the designated demo card exposes a hint ("special")
    if (!isDemo) {
      safeGiftData.password_hint = undefined;
    } else {
      safeGiftData.password_hint = 'special';
    }

    return NextResponse.json({
      success: true,
      gift: {
        ...safeGiftData,
        is_demo: isDemo,
        password_version: gift.password_version || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
