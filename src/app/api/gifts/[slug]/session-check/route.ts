import { NextRequest, NextResponse } from 'next/server';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_GIFTS } from '@/lib/mock-data';

/**
 * GET /api/gifts/[slug]/session-check
 * Lightweight heartbeat check called periodically (or upon navigating sections)
 * by open recipient tabs to immediately detect card password changes or access revocation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Fast-path: builder preview or draft placeholders never require recipient access sessions
    if (slug === 'builder-preview' || slug === 'surprise') {
      return NextResponse.json({ valid: true });
    }

    let gift = MOCK_GIFTS[slug];
    if (!gift) {
      try {
        const supabaseAdmin = createAdminClient();
        const { data: dbGift } = await supabaseAdmin
          .from('gifts')
          .select('id, slug, password_version')
          .eq('slug', slug)
          .maybeSingle();

        if (dbGift) {
          gift = dbGift as any;
        }
      } catch {}
    }

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    const cookieName = getRecipientCookieName(slug);
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          requiresPassword: true,
          message: 'Access session expired or not found.',
        },
        { status: 401 }
      );
    }

    const authCheck = await verifyRecipientToken(
      token,
      gift.id,
      gift.password_version || 1
    );

    if (!authCheck.valid) {
      const response = NextResponse.json(
        {
          valid: false,
          requiresPassword: true,
          passwordRevoked: !!authCheck.passwordRevoked,
          message: authCheck.passwordRevoked
            ? 'The card password has been updated. Please enter the new password to continue.'
            : 'Access session is invalid.',
        },
        { status: 401 }
      );

      // Invalidate existing cookie on the browser
      response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
      return response;
    }

    return NextResponse.json({
      valid: true,
      passwordVersion: gift.password_version || 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
