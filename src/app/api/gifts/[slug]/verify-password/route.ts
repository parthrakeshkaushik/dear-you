import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limiter';
import { verifyPassword } from '@/lib/auth/password';
import { createRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { checkGiftExpiry } from '@/lib/expiry';
import { MOCK_GIFTS } from '@/lib/mock-data';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { password } = body;

    // Rate Limiting by IP or forwarded address
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${ip}:${slug}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many password attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Retrieve gift
    const gift = MOCK_GIFTS[slug];

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // Moderation & Deletion check
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
          error: 'This gift is currently unavailable. Please contact the person who shared this gift with you.',
          isUnavailable: true,
        },
        { status: 423 }
      );
    }

    // Server-side expiry check
    const expiry = checkGiftExpiry(gift.expiry_enabled, gift.expires_at, gift.expiry_timezone);
    if (expiry.isExpired) {
      return NextResponse.json(
        {
          error: 'This gift has expired and reached its final page.',
          isExpired: true,
        },
        { status: 410 }
      );
    }

    // Check if this is the designated demonstration card
    const isDemo = gift.is_demo === true || slug === 'demo' || slug === 'demo-gift';

    // Password verification logic
    let isMatch = false;
    if (isDemo && password === 'show') {
      isMatch = true;
    } else if (gift.password_hash) {
      isMatch = await verifyPassword(password, gift.password_hash);
    } else {
      // Fallback for demo cards without explicit hash
      isMatch = isDemo && (password === 'show' || password === 'special');
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          error: `Incorrect password. ${rateCheck.remainingAttempts} attempts remaining.`,
        },
        { status: 401 }
      );
    }

    // Success: reset rate limit and issue JWT session cookie bound to current password_version
    resetRateLimit(rateLimitKey);
    const passwordVersion = gift.password_version || 1;
    const token = await createRecipientToken(gift.id, gift.slug, passwordVersion);

    const response = NextResponse.json({
      success: true,
      message: 'Access granted',
      passwordVersion,
    });

    const cookieName = getRecipientCookieName(slug);
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days (revoked immediately on password change)
    });

    return response;
  } catch (error: any) {
    console.error('Password verification error:', error);
    return NextResponse.json({ error: 'Server verification failure' }, { status: 500 });
  }
}
