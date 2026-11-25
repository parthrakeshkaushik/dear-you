import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { checkGiftExpiry } from '@/lib/expiry';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { isAuthorizedPreviewUser } from '@/lib/auth/roles';
import { generateOfflineCardHtml } from '@/lib/download/generate-offline-card';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // 1. Check Moderation & Soft-Deletion
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
          error: 'This gift is currently unavailable for download.',
          isUnavailable: true,
        },
        { status: 423 }
      );
    }

    // 2. Check Creator Status
    const owner = MOCK_USERS.find((u) => u.id === gift.owner_id);
    if (owner && owner.account_status === 'suspended') {
      return NextResponse.json(
        {
          error: 'This gift is currently unavailable.',
          isUnavailable: true,
        },
        { status: 423 }
      );
    }

    // 3. Strict Server-Side Expiry Enforcement
    // Expired cards CANNOT be downloaded online after expiration!
    const expiry = checkGiftExpiry(gift.expiry_enabled, gift.expires_at, gift.expiry_timezone);
    if (expiry.isExpired) {
      return NextResponse.json(
        {
          error:
            'This online gift has expired and cannot be downloaded online. However, if you previously downloaded an offline package, that saved copy can still be opened on your device.',
          isExpired: true,
        },
        { status: 410 }
      );
    }

    // 4. Password Protection Check
    const cookieName = getRecipientCookieName(slug);
    const token = request.cookies.get(cookieName)?.value;
    const wantsPreview = request.nextUrl.searchParams.get('preview') === 'true';

    let isAuthorizedPreview = false;
    if (wantsPreview) {
      const authPreview = await isAuthorizedPreviewUser(request, gift.owner_id);
      isAuthorizedPreview = authPreview.isAuthorized;
    }

    let hasAccess = false;
    let isPasswordRevoked = false;
    if (token) {
      const authCheck = await verifyRecipientToken(token, gift.id, gift.password_version || 1);
      hasAccess = authCheck.valid;
      isPasswordRevoked = !!authCheck.passwordRevoked;
    }

    if (gift.password_hash && !hasAccess && !isAuthorizedPreview) {
      const response = NextResponse.json(
        {
          error: isPasswordRevoked
            ? 'The card password has been updated. Please enter the new password to continue.'
            : 'Password verification required to download this gift.',
          requiresPassword: true,
          passwordRevoked: isPasswordRevoked,
        },
        { status: 401 }
      );
      if (isPasswordRevoked) {
        response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
      }
      return response;
    }

    // 5. Generate Standalone Offline HTML
    const offlineHtml = generateOfflineCardHtml(gift);

    // 6. Generate Self-Contained ZIP Archive
    const zip = new JSZip();

    // Add main offline webpage
    zip.file('index.html', offlineHtml);

    // Add Readme instructions for recipient
    const readmeContent = `======================================================================
DEAR YOU — PERMANENT PERSONAL KEEPSAKE
Special Surprise Crafted for: ${gift.recipient_name}
Title: ${gift.title}
======================================================================

Dear ${gift.recipient_name},

This is your personal, self-contained offline gift package created with Dear You.

HOW TO OPEN & EXPLORE:
1. Double-click the "index.html" file.
2. It will open in your preferred web browser (Chrome, Safari, Edge, Firefox, etc.).
3. No internet connection or login is needed!
4. All messages, memories, scratch reveals, and letters are saved here.

You can save this folder to your phone, tablet, computer, or cloud drive,
and revisit your special surprise anytime—forever.

With warmth,
The Dear You Platform
`;
    zip.file('README.txt', readmeContent);

    const zipUint8Array = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // 7. Update Download Count & Audit Log
    try {
      gift.download_count = (gift.download_count || 0) + 1;
      gift.last_downloaded_at = new Date().toISOString();

      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from('gifts')
        .update({
          download_count: gift.download_count,
          last_downloaded_at: gift.last_downloaded_at,
        })
        .eq('id', gift.id);

      await supabaseAdmin.from('developer_audit_logs').insert({
        developer_email: 'recipient@download',
        action_type: 'gift_downloaded',
        target_gift_id: gift.id,
        target_gift_title: gift.title,
        details: {
          recipient_name: gift.recipient_name,
          slug: gift.slug,
          format: 'zip',
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch (dbErr) {
      console.warn('Download tracking note:', dbErr);
    }

    // 8. Stream ZIP download to recipient
    return new NextResponse(zipUint8Array as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="dear-you-${gift.slug}-keepsake.zip"`,
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Length': zipUint8Array.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download card error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating download package.' },
      { status: 500 }
    );
  }
}
