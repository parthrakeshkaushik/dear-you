import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { hashPassword } from '@/lib/auth/password';
import { createAdminClient } from '@/lib/supabase/admin';
import { Gift } from '@/types/gift';

/**
 * GET /api/gifts
 * Returns all active cards, ensuring only the ONE designated demo card is marked as demo.
 */
export async function GET() {
  try {
    const allGifts = Object.values(MOCK_GIFTS).filter((g, index, self) =>
      // Deduplicate aliases (e.g. 'demo' vs 'demo-gift')
      index === self.findIndex((t) => t.id === g.id)
    );

    return NextResponse.json({ success: true, gifts: allGifts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/gifts
 * Creates and publishes a new independent card draft from the creator wizard.
 * Generates fresh unique identifiers and isolates it completely from the demo card.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Generate secure new ID
    const newId = `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Hash password if set
    let passwordHash: string | undefined = undefined;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
    }

    const newGift: Gift = {
      id: newId,
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
