import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { hashPassword } from '@/lib/auth/password';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';
import { Gift } from '@/types/gift';

const DEMO_CARD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

/**
 * Extracts authenticated user ID from request session cookies or headers.
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // 1. Check custom persistent session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const sessionCheck = await verifySessionExpiryToken(sessionCookie);
    if (sessionCheck.valid && sessionCheck.userId) {
      return sessionCheck.userId;
    }
  }

  // 2. Check Supabase auth cookie / header
  try {
    const supabaseAdmin = createAdminClient();
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user?.id) return user.id;
    }
  } catch {
    // Non-blocking fallback
  }

  return null;
}

/**
 * GET /api/gifts
 * Returns ONLY cards genuinely created and owned by the authenticated user.
 * Strictly excludes the public demonstration card and other users' cards.
 * Returns empty array [] for users who have not created any cards yet.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view your cards.' },
        { status: 401 }
      );
    }

    const searchId = request.nextUrl.searchParams.get('id');
    const searchSlug = request.nextUrl.searchParams.get('slug');

    const supabaseAdmin = createAdminClient();
    const userCards: Gift[] = [];

    // 1. Query Supabase database for cards owned by this authenticated user
    try {
      let query = supabaseAdmin
        .from('gifts')
        .select('*')
        .eq('owner_id', userId)
        .neq('id', DEMO_CARD_ID);

      if (searchId) {
        query = query.eq('id', searchId);
      } else if (searchSlug) {
        query = query.eq('slug', searchSlug);
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: dbCards, error: dbErr } = await query;

      if (!dbErr && dbCards && dbCards.length > 0) {
        // Filter out any demo card or deleted card
        for (const card of dbCards) {
          if (
            card.id !== DEMO_CARD_ID &&
            card.slug !== 'demo' &&
            card.slug !== 'demo-gift' &&
            card.is_demo !== true &&
            card.moderation_status !== 'deleted'
          ) {
            userCards.push(card as Gift);
          }
        }
      }
    } catch (dbQueryErr) {
      console.warn('Database user cards fetch note:', dbQueryErr);
    }

    // 2. Query in-memory repository for newly created/drafted cards in this runtime session
    const memoryUserCards = Object.values(MOCK_GIFTS).filter(
      (g) =>
        g.owner_id === userId &&
        g.id !== DEMO_CARD_ID &&
        g.slug !== 'demo' &&
        g.slug !== 'demo-gift' &&
        g.is_demo !== true &&
        g.moderation_status !== 'deleted' &&
        (!searchId || g.id === searchId) &&
        (!searchSlug || g.slug === searchSlug)
    );

    // Merge and deduplicate by card ID
    for (const memCard of memoryUserCards) {
      if (!userCards.some((c) => c.id === memCard.id)) {
        userCards.push(memCard);
      }
    }

    // Strict rule: Demonstration card and sample cards are NEVER returned to user accounts!
    const strictlyFilteredCards = userCards.filter(
      (card) =>
        card.id !== DEMO_CARD_ID &&
        card.slug !== 'demo' &&
        card.slug !== 'demo-gift' &&
        card.is_demo !== true
    );

    if (searchId || searchSlug) {
      if (strictlyFilteredCards.length === 0) {
        return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
      }
      return NextResponse.json({ success: true, gift: strictlyFilteredCards[0] });
    }

    return NextResponse.json({
      success: true,
      gifts: strictlyFilteredCards,
      totalCount: strictlyFilteredCards.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/gifts
 * Creates a new draft or updates an existing draft/card.
 * If draft_id is provided, updates the existing record without duplicating.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = (await getAuthenticatedUserId(request)) || 'anonymous-creator';
    const body = await request.json();
    const {
      draft_id,
      id: existingProvidedId,
      recipient_name = '',
      title,
      slug: requestedSlug,
      event_type = 'Birthday',
      event_date,
      selected_theme = 'dreamy',
      theme_config,
      introduction,
      welcome_heading,
      welcome_message,
      welcome_button_text,
      gift_box_message,
      scratch_card_hidden_text,
      closing_message,
      password,
      password_hint,
      expiry_enabled = false,
      expires_at,
      expiry_timezone = 'Asia/Kolkata',
      expiry_heading,
      expiry_message,
      music_url,
      music_title,
      memory_wall_config,
      sections,
      memories,
      timeline_entries,
      quiz_questions,
      secret_messages,
      letters,
      wishes,
      status = 'published',
    } = body;

    const targetId = draft_id || existingProvidedId;

    // Check if updating an existing card/draft owned by this user
    let existingGift: Gift | undefined = undefined;
    if (targetId) {
      existingGift = Object.values(MOCK_GIFTS).find(
        (g) => g.id === targetId && (g.owner_id === userId || userId === 'anonymous-creator')
      );
    }

    // Generate unique slug
    let finalSlug: string = existingGift?.slug || '';
    if (!finalSlug) {
      let baseSlug = (requestedSlug || `${recipient_name || 'gift'}-surprise`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!baseSlug || baseSlug === 'demo' || baseSlug === 'demo-gift') {
        baseSlug = `${baseSlug || 'gift'}-${Date.now().toString().slice(-4)}`;
      }

      finalSlug = baseSlug;
      if (MOCK_GIFTS[finalSlug] && MOCK_GIFTS[finalSlug].id !== targetId) {
        finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }
    }

    // Generate fresh UUID if new card
    const finalId = targetId || `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Hash password if set and updated
    let passwordHash: string | undefined = existingGift?.password_hash;
    let passwordVersion = existingGift?.password_version || 1;

    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
      if (existingGift?.password_hash && passwordHash !== existingGift.password_hash) {
        passwordVersion = (existingGift.password_version || 1) + 1;
      }
    }

    const savedGift: Gift = {
      ...(existingGift || {}),
      id: finalId,
      owner_id: userId,
      recipient_name: (recipient_name || 'Dear Someone').trim(),
      title: title?.trim() || (recipient_name ? `A Special Surprise for ${recipient_name}` : 'Untitled Card'),
      slug: finalSlug,
      event_type,
      event_date,
      selected_theme,
      theme_config,
      status,
      introduction,
      welcome_heading,
      welcome_message,
      welcome_button_text,
      gift_box_message,
      scratch_card_hidden_text,
      closing_message,
      password_hash: passwordHash,
      password_hint: password_hint?.trim() || undefined,
      password_version: passwordVersion,
      is_demo: false,
      expiry_enabled: !!expiry_enabled,
      expires_at: expiry_enabled ? expires_at : null,
      expiry_timezone,
      expiry_heading,
      expiry_message,
      music_url,
      music_title,
      memory_wall_config,
      sections: sections || [],
      memories: memories || [],
      timeline_entries: timeline_entries || [],
      quiz_questions: quiz_questions || [],
      secret_messages: secret_messages || [],
      letters: letters || [],
      wishes: wishes || [],
      created_at: existingGift?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at:
        status === 'published'
          ? existingGift?.published_at || new Date().toISOString()
          : null,
    };

    // Store in memory repository
    MOCK_GIFTS[finalSlug] = savedGift;

    // Persist to Supabase
    try {
      const supabaseAdmin = createAdminClient();
      const payload = {
        id: finalId,
        owner_id: userId,
        recipient_name: savedGift.recipient_name,
        title: savedGift.title,
        slug: savedGift.slug,
        event_type: savedGift.event_type,
        event_date: savedGift.event_date || null,
        selected_theme: savedGift.selected_theme,
        status: savedGift.status,
        password_hash: savedGift.password_hash,
        password_hint: savedGift.password_hint,
        password_version: savedGift.password_version,
        expiry_enabled: savedGift.expiry_enabled,
        expires_at: savedGift.expires_at || null,
        expiry_timezone: savedGift.expiry_timezone,
        published_at: savedGift.published_at,
        updated_at: savedGift.updated_at,
      };

      if (existingGift) {
        await supabaseAdmin
          .from('gifts')
          .update(payload)
          .eq('id', finalId)
          .eq('owner_id', userId);
      } else {
        await supabaseAdmin.from('gifts').insert(payload);
      }
    } catch (dbErr) {
      console.warn('Database save note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      gift: savedGift,
      draft_id: finalId,
      url: `/g/${finalSlug}`,
    });
  } catch (error: any) {
    console.error('Save gift error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/gifts
 * Quick metadata update (e.g. rename draft).
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, recipient_name } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    let updatedGift: Gift | null = null;
    for (const [slug, gift] of Object.entries(MOCK_GIFTS)) {
      if (gift.id === id && gift.owner_id === userId) {
        if (title !== undefined) gift.title = title.trim();
        if (recipient_name !== undefined) gift.recipient_name = recipient_name.trim();
        gift.updated_at = new Date().toISOString();
        updatedGift = gift;
      }
    }

    try {
      const supabaseAdmin = createAdminClient();
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title.trim();
      if (recipient_name !== undefined) updates.recipient_name = recipient_name.trim();

      await supabaseAdmin.from('gifts').update(updates).eq('id', id).eq('owner_id', userId);
    } catch (err) {
      console.warn('DB update note:', err);
    }

    return NextResponse.json({ success: true, gift: updatedGift });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/gifts
 * Deletes a draft or card owned by the user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    for (const [slug, gift] of Object.entries(MOCK_GIFTS)) {
      if (gift.id === id && gift.owner_id === userId) {
        delete MOCK_GIFTS[slug];
      }
    }

    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from('gifts').delete().eq('id', id).eq('owner_id', userId);
    } catch (err) {
      console.warn('DB delete note:', err);
    }

    return NextResponse.json({ success: true, message: 'Card deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
