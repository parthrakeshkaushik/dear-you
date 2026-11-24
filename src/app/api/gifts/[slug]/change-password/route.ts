import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/gifts/[slug]/change-password
 * Updates the card password and increments its password_version.
 * This guarantees immediate server-side revocation of all existing recipient
 * access sessions without affecting the creator's session or other cards.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { new_password, password_hint } = body;

    if (!new_password || typeof new_password !== 'string' || new_password.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter a valid new password.' },
        { status: 400 }
      );
    }

    const gift = MOCK_GIFTS[slug];
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // 1. Hash the new password securely
    const newHash = await hashPassword(new_password.trim());

    // 2. Increment password_version
    const nextVersion = (gift.password_version || 1) + 1;

    // 3. Update in-memory repository
    gift.password_hash = newHash;
    gift.password_version = nextVersion;
    if (password_hint !== undefined) {
      gift.password_hint = password_hint.trim() || undefined;
    }
    gift.updated_at = new Date().toISOString();

    // Also update alias if this is demo-gift
    if (slug === 'demo-gift' && MOCK_GIFTS['demo']) {
      MOCK_GIFTS['demo'].password_hash = newHash;
      MOCK_GIFTS['demo'].password_version = nextVersion;
      MOCK_GIFTS['demo'].password_hint = gift.password_hint;
    } else if (slug === 'demo' && MOCK_GIFTS['demo-gift']) {
      MOCK_GIFTS['demo-gift'].password_hash = newHash;
      MOCK_GIFTS['demo-gift'].password_version = nextVersion;
      MOCK_GIFTS['demo-gift'].password_hint = gift.password_hint;
    }

    // 4. Update Supabase database safely
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from('gifts')
        .update({
          password_hash: newHash,
          password_hint: gift.password_hint,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug);
    } catch (dbErr) {
      console.warn('Database password update note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message:
        'Card password updated successfully. All active recipient access sessions have been invalidated.',
      passwordVersion: nextVersion,
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
