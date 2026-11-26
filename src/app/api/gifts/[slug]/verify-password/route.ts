import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/security/rate-limiter';
import { verifyPassword } from '@/lib/auth/password';
import { createRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { checkGiftExpiry } from '@/lib/expiry';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { unpackDatabaseGift } from '@/app/api/gifts/route';

const FRIENDLY_PASSWORD_MESSAGES = [
  "That was a good try! But I think there's another little secret to discover. Try again!",
  "Almost there! Someone special is waiting for you inside. Give it another shot!",
  "Nice attempt! I think you can solve this little mystery.",
  "Not quite this time! Think about the hint and try once more.",
  "You're getting closer! Take another guess.",
  "A little mystery deserves a little patience. Try again!",
  "Good effort! Maybe that special memory holds the answer.",
  "Oops! That wasn't the secret word. One more try?",
  "The surprise is still waiting for you. Give it another go!",
  "A lovely surprise is just one correct password away!",
];

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { password } = body;

    const cleanPassword = (password || '').trim();

    // Do not count empty submissions as password attempts
    if (!cleanPassword) {
      return NextResponse.json(
        { error: 'Please enter the access password to open this gift.' },
        { status: 400 }
      );
    }

    // Rate Limiting by IP and card slug: at least 10 attempts before 15-minute cooldown
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${ip}:${slug}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've tried several times! Take a short 15-minute breather to think of the secret clue, and you'll be able to try again.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
          isBlocked: true,
        },
        { status: 429 }
      );
    }

    // Retrieve gift
    let gift = MOCK_GIFTS[slug];

    if (!gift) {
      try {
        const supabaseAdmin = createAdminClient();
        const { data: dbGift } = await supabaseAdmin
          .from('gifts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (dbGift) {
          gift = unpackDatabaseGift(dbGift);
          MOCK_GIFTS[slug] = gift;
        }
      } catch (dbErr) {
        console.warn('Verify password gift db fallback note:', dbErr);
      }
    }

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

    if (isDemo && (cleanPassword.toLowerCase() === 'special' || cleanPassword === 'special')) {
      isMatch = true;
    } else if (gift.password_hash) {
      isMatch = await verifyPassword(cleanPassword, gift.password_hash);
    } else {
      // Fallback for demo cards without explicit hash
      isMatch = isDemo && (cleanPassword.toLowerCase() === 'special');
    }

    if (!isMatch) {
      // Record failed attempt securely on server
      const failed = recordFailedAttempt(rateLimitKey, 10, 15 * 60 * 1000);

      if (failed.isBlocked) {
        return NextResponse.json(
          {
            error: `You've tried several times! Take a short 15-minute breather to think of the secret clue, and you'll be able to try again.`,
            retryAfterSeconds: failed.retryAfterSeconds,
            isBlocked: true,
          },
          { status: 429 }
        );
      }

      const msgIndex = Math.max(0, (10 - failed.remainingAttempts - 1) % FRIENDLY_PASSWORD_MESSAGES.length);
      const friendlyMessage = FRIENDLY_PASSWORD_MESSAGES[msgIndex];
      const remainingText =
        failed.remainingAttempts === 1
          ? '1 attempt remaining.'
          : failed.remainingAttempts <= 3
          ? `${failed.remainingAttempts} little chances left.`
          : `${failed.remainingAttempts} attempts remaining.`;

      return NextResponse.json(
        {
          error: `${friendlyMessage} (${remainingText})`,
          friendlyMessage,
          remainingAttempts: failed.remainingAttempts,
          remainingText,
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
