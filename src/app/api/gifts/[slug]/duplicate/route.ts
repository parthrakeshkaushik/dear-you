import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformContentLimits, countWords } from '@/lib/config/content-limits';
import { Gift } from '@/types/gift';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const {
      new_title,
      new_recipient_name,
      new_slug,
      expiry_enabled = false,
      expires_at = null,
    } = body;

    if (new_title) {
      const limits = getPlatformContentLimits();
      if (limits.fields.cardTitle.enabled && countWords(new_title) > limits.fields.cardTitle.maxWords) {
        return NextResponse.json(
          { error: `New title exceeds the ${limits.fields.cardTitle.maxWords}-word limit.` },
          { status: 400 }
        );
      }
    }

    const sourceGift = MOCK_GIFTS[slug];
    if (!sourceGift) {
      return NextResponse.json({ error: 'Source gift not found' }, { status: 404 });
    }

    const newId = crypto.randomUUID();
    const generatedSlug =
      new_slug?.trim() ||
      `${sourceGift.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;

    const nowIso = new Date().toISOString();

    // Independent audio handling for duplicated gifts
    let duplicateCustomAudioPath = sourceGift.custom_audio_storage_path;
    if (sourceGift.custom_audio_storage_path && sourceGift.music_source === 'upload') {
      try {
        const supabaseAdmin = createAdminClient();
        const ext = sourceGift.custom_audio_storage_path.split('.').pop() || 'mp3';
        const newPath = `gift-audio/${newId}/copy-${Date.now()}.${ext}`;
        const { error: copyErr } = await supabaseAdmin.storage
          .from('gifts')
          .copy(sourceGift.custom_audio_storage_path, newPath);
        if (!copyErr) {
          duplicateCustomAudioPath = newPath;
        }
      } catch (copyErr) {
        console.warn('Storage copy note during duplication:', copyErr);
      }
    }

    // Deep clone arrays with new independent IDs
    const clonedMemories = sourceGift.memories
      ? sourceGift.memories.map((m) => ({
          ...m,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const clonedSections = sourceGift.sections
      ? sourceGift.sections.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const clonedTimeline = sourceGift.timeline_entries
      ? sourceGift.timeline_entries.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const clonedQuiz = sourceGift.quiz_questions
      ? sourceGift.quiz_questions.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
          gift_id: newId,
          options: q.options.map((o) => ({
            ...o,
            id: crypto.randomUUID(),
          })),
        }))
      : [];

    const clonedLetters = sourceGift.letters
      ? sourceGift.letters.map((l) => ({
          ...l,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const clonedWishes = sourceGift.wishes
      ? sourceGift.wishes.map((w) => ({
          ...w,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const clonedSecrets = sourceGift.secret_messages
      ? sourceGift.secret_messages.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          gift_id: newId,
        }))
      : [];

    const duplicatedGift: Gift = {
      ...sourceGift,
      id: newId,
      slug: generatedSlug,
      title: new_title?.trim() || `${sourceGift.title} (Copy)`,
      recipient_name: new_recipient_name?.trim() || sourceGift.recipient_name,
      status: 'draft', // Duplicates start as Draft per requirements
      moderation_status: 'active',
      source_gift_id: sourceGift.id,
      download_count: 0,
      last_downloaded_at: undefined,
      republished_at: undefined,
      expiry_enabled: Boolean(expiry_enabled),
      expires_at: expiry_enabled ? expires_at : null,
      music_enabled: sourceGift.music_enabled ?? (sourceGift.music_source !== 'none'),
      music_source: sourceGift.music_source || (sourceGift.music_url ? 'library' : 'none'),
      library_track_id: sourceGift.library_track_id,
      custom_audio_storage_path: duplicateCustomAudioPath,
      custom_audio_filename: sourceGift.custom_audio_filename,
      audio_duration: sourceGift.audio_duration,
      playback_start_time: sourceGift.playback_start_time ?? 0,
      playback_end_time: sourceGift.playback_end_time,
      loop_enabled: sourceGift.loop_enabled ?? true,
      music_url: sourceGift.music_source === 'none' ? undefined : (duplicateCustomAudioPath ? `/api/gifts/${generatedSlug}/audio` : sourceGift.music_url),
      music_title: sourceGift.music_title,
      memories: clonedMemories,
      sections: clonedSections,
      timeline_entries: clonedTimeline,
      quiz_questions: clonedQuiz,
      letters: clonedLetters,
      wishes: clonedWishes,
      secret_messages: clonedSecrets,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store in-memory
    MOCK_GIFTS[generatedSlug] = duplicatedGift;

    // Persist to Supabase if available
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from('gifts').insert({
        id: duplicatedGift.id,
        owner_id: duplicatedGift.owner_id,
        recipient_name: duplicatedGift.recipient_name,
        title: duplicatedGift.title,
        slug: duplicatedGift.slug,
        event_type: duplicatedGift.event_type,
        event_date: duplicatedGift.event_date,
        selected_theme: duplicatedGift.selected_theme,
        theme_config: duplicatedGift.theme_config,
        status: 'draft',
        source_gift_id: sourceGift.id,
        expiry_enabled: duplicatedGift.expiry_enabled,
        expires_at: duplicatedGift.expires_at,
        expiry_timezone: duplicatedGift.expiry_timezone,
        welcome_heading: duplicatedGift.welcome_heading,
        welcome_message: duplicatedGift.welcome_message,
        gift_box_message: duplicatedGift.gift_box_message,
        scratch_card_hidden_text: duplicatedGift.scratch_card_hidden_text,
        closing_message: duplicatedGift.closing_message,
        music_enabled: duplicatedGift.music_enabled,
        music_source: duplicatedGift.music_source,
        library_track_id: duplicatedGift.library_track_id || null,
        custom_audio_storage_path: duplicatedGift.custom_audio_storage_path || null,
        custom_audio_filename: duplicatedGift.custom_audio_filename || null,
        audio_duration: duplicatedGift.audio_duration || null,
        playback_start_time: duplicatedGift.playback_start_time ?? 0,
        playback_end_time: duplicatedGift.playback_end_time || null,
        loop_enabled: duplicatedGift.loop_enabled ?? true,
        music_url: duplicatedGift.music_url || null,
        music_title: duplicatedGift.music_title || null,
      });

      // Audit Log
      await supabaseAdmin.from('developer_audit_logs').insert({
        developer_email: 'creator@duplicate',
        action_type: 'gift_duplicated',
        target_gift_id: duplicatedGift.id,
        target_gift_title: duplicatedGift.title,
        details: {
          source_gift_id: sourceGift.id,
          source_gift_title: sourceGift.title,
          new_slug: duplicatedGift.slug,
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch (dbErr) {
      console.warn('Database duplicate persistence note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Gift duplicated successfully as "${duplicatedGift.title}" (Draft).`,
      duplicatedGift,
      redirect: `/admin/create?edit=${duplicatedGift.id}`,
    });
  } catch (error: any) {
    console.error('Duplicate gift error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to duplicate gift.' },
      { status: 500 }
    );
  }
}
