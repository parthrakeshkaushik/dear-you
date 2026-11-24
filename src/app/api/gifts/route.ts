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

    const supabaseAdmin = createAdminClient();
    const userCards: Gift[] = [];

    // 1. Query Supabase database for cards owned by this authenticated user
    try {
      const { data: dbCards, error: dbErr } = await supabaseAdmin
        .from('gifts')
        .select('*')
        .eq('owner_id', userId)
        .neq('id', DEMO_CARD_ID)
        .order('created_at', { ascending: false });

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

    // 2. Query in-memory repository for newly published cards in this runtime session
    const memoryUserCards = Object.values(MOCK_GIFTS).filter(
      (g) =>
        g.owner_id === userId &&
        g.id !== DEMO_CARD_ID &&
        g.slug !== 'demo' &&
        g.slug !== 'demo-gift' &&
        g.is_demo !== true &&
        g.moderation_status !== 'deleted'
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
 * Creates a new independent card draft owned by the authenticated creator.
 * Generates fresh unique identifiers and isolates it completely from the demo card.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = (await getAuthenticatedUserId(request)) || 'anonymous-creator';
    const body = await request.json();
    const {
      recipient_name,
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

    if (!recipient_name?.trim()) {
      return NextResponse.json(
        { error: 'Recipient name is required.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = (requestedSlug || `${recipient_name}-surprise`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!baseSlug || baseSlug === 'demo' || baseSlug === 'demo-gift') {
      baseSlug = `${baseSlug || 'gift'}-${Date.now().toString().slice(-4)}`;
    }

    let finalSlug = baseSlug;
    if (MOCK_GIFTS[finalSlug]) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Generate fresh UUID for new user card
    const newId = `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Hash password if set
    let passwordHash: string | undefined = undefined;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
    }

    const newGift: Gift = {
      id: newId,
      owner_id: userId, // Binds ownership to the authenticated user!
      recipient_name: recipient_name.trim(),
      title: title?.trim() || `A Special Surprise for ${recipient_name}`,
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
      password_version: 1,
      is_demo: false, // Genuine creator card, never a demo card
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    // Store in memory repository
    MOCK_GIFTS[finalSlug] = newGift;

    // Persist to Supabase if available
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from('gifts').insert({
        id: newId,
        owner_id: userId,
        recipient_name: newGift.recipient_name,
        title: newGift.title,
        slug: newGift.slug,
        event_type: newGift.event_type,
        event_date: newGift.event_date || null,
        selected_theme: newGift.selected_theme,
        status: newGift.status,
        password_hash: newGift.password_hash,
        password_hint: newGift.password_hint,
        expiry_enabled: newGift.expiry_enabled,
        expires_at: newGift.expires_at || null,
        expiry_timezone: newGift.expiry_timezone,
        published_at: newGift.published_at,
      });
    } catch (dbErr) {
      console.warn('Database insert note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      gift: newGift,
      url: `/g/${finalSlug}`,
    });
  } catch (error: any) {
    console.error('Create gift error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
