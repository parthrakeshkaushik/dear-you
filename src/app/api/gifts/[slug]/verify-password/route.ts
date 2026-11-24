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

    // Password verification logic
    let isMatch = false;
    if (gift.password_hash) {
      isMatch = await verifyPassword(password, gift.password_hash);
    } else {
      // Fallback for default demo / test gifts without explicit hash
      isMatch = password === 'special' || password === 'love' || password === 'birthday';
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          error: `Incorrect password. ${rateCheck.remainingAttempts} attempts remaining.`,
        },
        { status: 401 }
      );
    }

    // Success: reset rate limit and issue JWT session cookie
    resetRateLimit(rateLimitKey);
    const token = await createRecipientToken(gift.id, gift.slug);

    const response = NextResponse.json({
      success: true,
      message: 'Access granted',
    });

    const cookieName = getRecipientCookieName(slug);
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred' },
      { status: 500 }
    );
  }
}
