import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { hashPassword } from '@/lib/auth/password';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifySessionExpiryToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/persistent-session';
import {
  getPlatformContentLimits,
  countWords,
  getUniquePhotos,
  PlatformContentLimits,
} from '@/lib/config/content-limits';
import { validateSlugFormat, normalizeSlug } from '@/lib/gifts/slug-rules';
import { Gift, MusicSource } from '@/types/gift';
import { getMusicTrackById, DEFAULT_LIBRARY_TRACK } from '@/config/music-library';

const DEMO_CARD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

/**
 * Validates text content word limits and photo upload limits.
 * Returns an error string if validation fails, or null if valid.
 * Preserves legacy existing card content unless the creator specifically expands it beyond limits.
 */
function validateGiftContentLimits(
  giftData: any,
  existingGift: Gift | undefined,
  limits: PlatformContentLimits
): string | null {
  // 1. Validate Photo Limits (Unique across Memory Wall, Gallery, Timeline, Cover)
  const uniquePhotos = getUniquePhotos(giftData);
  if (uniquePhotos.length > limits.maxPhotos) {
    const prevCount = existingGift ? getUniquePhotos(existingGift).length : 0;
    // If new card OR user added additional photos beyond existing count
    if (!existingGift || uniquePhotos.length > prevCount) {
      return `This card contains ${uniquePhotos.length} unique photos, exceeding the platform limit of ${limits.maxPhotos} photos. Please remove ${uniquePhotos.length - limits.maxPhotos} photo(s) before saving.`;
    }
  }

  // Helper to check a single field
  const checkField = (
    fieldValue: string | undefined | null,
    prevValue: string | undefined | null,
    limitConfig: { maxWords: number; enabled: boolean; label: string }
  ): string | null => {
    if (!limitConfig.enabled || !fieldValue) return null;
    const words = countWords(fieldValue);
    if (words > limitConfig.maxWords) {
      const prevWords = prevValue ? countWords(prevValue) : 0;
      // Allow legacy text only if creator did not expand it further
      if (!existingGift || words > prevWords) {
        return `${limitConfig.label} exceeds the ${limitConfig.maxWords}-word limit (currently ${words} words). Please shorten it.`;
      }
    }
    return null;
  };

  // 2. Validate Card Title (10 words)
  let err = checkField(giftData.title, existingGift?.title, limits.fields.cardTitle);
  if (err) return err;

  // 3. Short Introduction (50 words)
  err = checkField(giftData.introduction, existingGift?.introduction, limits.fields.shortIntroduction);
  if (err) return err;

  // 4. Welcome Message (100 words)
  err = checkField(giftData.welcome_message, existingGift?.welcome_message, limits.fields.welcomeMessage);
  if (err) return err;

  // 5. Special Messages (150 words each)
  err = checkField(giftData.gift_box_message, existingGift?.gift_box_message, limits.fields.specialMessage);
  if (err) return err;

  err = checkField(giftData.scratch_card_hidden_text, existingGift?.scratch_card_hidden_text, limits.fields.specialMessage);
  if (err) return err;

  // 6. Final Closing Message (100 words)
  err = checkField(giftData.closing_message, existingGift?.closing_message, limits.fields.finalClosingMessage);
  if (err) return err;

  // 7. Individual Wishes (50 words each)
  if (Array.isArray(giftData.wishes)) {
    for (let i = 0; i < giftData.wishes.length; i++) {
      const wishText = typeof giftData.wishes[i] === 'string' ? giftData.wishes[i] : giftData.wishes[i]?.wish_text;
      err = checkField(wishText, undefined, limits.fields.individualWish);
      if (err) return `Wish #${i + 1}: ${err}`;
    }
  }

  // 8. Timeline Descriptions (50 words each)
  if (Array.isArray(giftData.timeline_entries)) {
    for (let i = 0; i < giftData.timeline_entries.length; i++) {
      const entry = giftData.timeline_entries[i];
      err = checkField(entry?.description, undefined, limits.fields.timelineDescription);
      if (err) return `Timeline entry "${entry?.title || i + 1}": ${err}`;
    }
  }

  // 9. Trivia Quiz (Question 30 words, Option 15 words)
  if (Array.isArray(giftData.quiz_questions)) {
    for (let i = 0; i < giftData.quiz_questions.length; i++) {
      const q = giftData.quiz_questions[i];
      err = checkField(q?.question, undefined, limits.fields.quizQuestion);
      if (err) return `Quiz Question #${i + 1}: ${err}`;

      if (Array.isArray(q?.options)) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          err = checkField(opt?.option_text, undefined, limits.fields.quizAnswer);
          if (err) return `Quiz Question #${i + 1}, Option #${j + 1}: ${err}`;
        }
      }
    }
  }

  // 10. Secret Messages (100 words each)
  if (Array.isArray(giftData.secret_messages)) {
    for (let i = 0; i < giftData.secret_messages.length; i++) {
      const msg = giftData.secret_messages[i];
      err = checkField(msg?.content, undefined, limits.fields.secretMessage);
      if (err) return `Secret message #${i + 1}: ${err}`;
    }
  }

  // 11. Personal Letters (300 words each)
  if (Array.isArray(giftData.letters)) {
    for (let i = 0; i < giftData.letters.length; i++) {
      const letter = giftData.letters[i];
      err = checkField(letter?.content, undefined, limits.fields.personalLetter);
      if (err) return `Letter "${letter?.heading || i + 1}": ${err}`;
    }
  }

  // 12. Memory Captions (30 words each)
  if (Array.isArray(giftData.memories)) {
    for (let i = 0; i < giftData.memories.length; i++) {
      const mem = giftData.memories[i];
      err = checkField(mem?.caption, undefined, limits.fields.memoryCaption);
      if (err) return `Memory photo #${i + 1} caption: ${err}`;
    }
  }

  return null;
}

/**
 * Validates whether a string is a standard RFC4122 UUID
 */
export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Unpacks and parses raw database rows into fully typed Gift objects.
 * Accurately extracts JSONB theme_config, per-gift background music properties,
 * sections, and interactive keepsake modules.
 */
export function unpackDatabaseGift(row: any): Gift {
  if (!row) return row;
  const themeConfig = (row.theme_config && typeof row.theme_config === 'object') ? row.theme_config : {};
  const musicConfig = (themeConfig.music && typeof themeConfig.music === 'object') ? themeConfig.music : {};

  return {
    ...row,
    music_enabled: typeof musicConfig.enabled === 'boolean'
      ? musicConfig.enabled
      : Boolean(row.music_url),
    music_source: (musicConfig.source as MusicSource) || (row.music_url ? 'library' : 'none'),
    library_track_id: musicConfig.library_track_id,
    custom_audio_storage_path: musicConfig.custom_audio_storage_path,
    custom_audio_filename: musicConfig.custom_audio_filename,
    audio_duration: musicConfig.duration,
    playback_start_time: musicConfig.start_time ?? 0,
    playback_end_time: musicConfig.end_time,
    loop_enabled: musicConfig.loop ?? true,
    music_url: row.music_url || musicConfig.url,
    music_title: row.music_title || musicConfig.title,
    sections: themeConfig.sections || row.sections || [],
    memories: themeConfig.memories || row.memories || [],
    timeline_entries: themeConfig.timeline_entries || row.timeline_entries || [],
    quiz_questions: themeConfig.quiz_questions || row.quiz_questions || [],
    secret_messages: themeConfig.secret_messages || row.secret_messages || [],
    letters: themeConfig.letters || row.letters || [],
    wishes: themeConfig.wishes || row.wishes || [],
    password_page_config: row.password_page_config || themeConfig.password_page,
    expiry_page_config: row.expiry_page_config || themeConfig.expiry_page,
  };
}

/**
 * Extracts authenticated user ID from request session cookies, Supabase SSR cookies, or headers.
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // 1. Check custom persistent session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    try {
      const sessionCheck = await verifySessionExpiryToken(sessionCookie);
      if (sessionCheck.valid && sessionCheck.userId) {
        return sessionCheck.userId;
      }
    } catch {}
  }

  // 2. Check Supabase SSR session cookies via createServerClient
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) return user.id;
  } catch {}

  // 3. Check Supabase auth cookie / header
  try {
    const supabaseAdmin = createAdminClient();
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user?.id) return user.id;
    }
  } catch {}

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
        for (const rawCard of dbCards) {
          if (
            rawCard.id !== DEMO_CARD_ID &&
            rawCard.slug !== 'demo' &&
            rawCard.slug !== 'demo-gift' &&
            rawCard.is_demo !== true &&
            rawCard.moderation_status !== 'deleted'
          ) {
            userCards.push(unpackDatabaseGift(rawCard));
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
    const rawUserId = await getAuthenticatedUserId(request);
    const userId = rawUserId || 'anonymous-creator';
    const validOwnerId = isValidUuid(rawUserId) ? rawUserId : null;
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
      music_enabled,
      music_source,
      library_track_id,
      custom_audio_storage_path,
      custom_audio_filename,
      audio_duration,
      playback_start_time,
      playback_end_time,
      loop_enabled,
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
      password_page_config,
      expiry_page_config,
      status = 'published',
    } = body;

    const targetId = draft_id || existingProvidedId;
    const supabaseAdmin = createAdminClient();

    // Check if updating an existing card/draft owned by this user
    let existingGift: Gift | undefined = undefined;
    if (targetId) {
      existingGift = Object.values(MOCK_GIFTS).find(
        (g) => g.id === targetId && (validOwnerId ? g.owner_id === validOwnerId : true)
      );
      if (!existingGift && isValidUuid(targetId)) {
        try {
          const { data: dbExisting } = await supabaseAdmin
            .from('gifts')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          if (dbExisting && (validOwnerId ? dbExisting.owner_id === validOwnerId : true)) {
            existingGift = unpackDatabaseGift(dbExisting);
          }
        } catch (dbLookupErr) {
          console.warn('Lookup existing gift warning:', dbLookupErr);
        }
      }
    }

    // Server-side enforcement of word limits and 15-photo maximum
    const activeLimits = getPlatformContentLimits();
    const validationError = validateGiftContentLimits(body, existingGift, activeLimits);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Enforce slug normalization, validation and uniqueness
    const rawSlugCandidate = (
      requestedSlug ||
      existingGift?.slug ||
      `${recipient_name || 'gift'}-surprise`
    ).trim();

    const slugValidation = validateSlugFormat(rawSlugCandidate);
    if (!slugValidation.valid) {
      return NextResponse.json({ error: slugValidation.error }, { status: 400 });
    }

    const finalSlug = slugValidation.normalized;

    // Check slug collision in memory
    const existingMemGift =
      MOCK_GIFTS[finalSlug] ||
      Object.values(MOCK_GIFTS).find((g) => g.slug === finalSlug);
    if (existingMemGift && existingMemGift.id !== targetId) {
      return NextResponse.json(
        { error: 'This custom URL slug is already taken. Please choose a different URL slug.' },
        { status: 409 }
      );
    }

    // Check slug collision in database
    try {
      const { data: dbCollision } = await supabaseAdmin
        .from('gifts')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (dbCollision && dbCollision.id !== targetId) {
        return NextResponse.json(
          { error: 'This custom URL slug is already taken. Please choose a different URL slug.' },
          { status: 409 }
        );
      }
    } catch (colErr) {
      console.warn('Slug collision check warning:', colErr);
    }

    // Generate fresh RFC4122 UUID if not provided or if legacy non-UUID format
    const finalId = targetId && isValidUuid(targetId) ? targetId : crypto.randomUUID();

    // Hash password if set and updated
    let passwordHash: string | undefined = existingGift?.password_hash;
    let passwordVersion = existingGift?.password_version || 1;

    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
      if (existingGift?.password_hash && passwordHash !== existingGift.password_hash) {
        passwordVersion = (existingGift.password_version || 1) + 1;
      }
    }

    const finalPasswordPageConfig =
      password_page_config || theme_config?.password_page || existingGift?.password_page_config;
    const finalExpiryPageConfig =
      expiry_page_config || theme_config?.expiry_page || existingGift?.expiry_page_config;

    // Resolve Per-Gift Independent Background Music Configuration
    let resolvedMusicSource: MusicSource =
      music_source ||
      existingGift?.music_source ||
      (music_url ? 'library' : 'none');

    let resolvedMusicEnabled =
      typeof music_enabled === 'boolean'
        ? music_enabled
        : typeof existingGift?.music_enabled === 'boolean'
        ? existingGift.music_enabled
        : resolvedMusicSource !== 'none';

    if (resolvedMusicSource === 'none') {
      resolvedMusicEnabled = false;
    }

    let resolvedLibraryTrackId: string | undefined =
      library_track_id || existingGift?.library_track_id;
    let resolvedCustomStoragePath: string | undefined =
      custom_audio_storage_path || existingGift?.custom_audio_storage_path;
    let resolvedCustomFilename: string | undefined =
      custom_audio_filename || existingGift?.custom_audio_filename;
    let resolvedAudioDuration: number | undefined =
      audio_duration || existingGift?.audio_duration;
    let resolvedStartTime: number =
      typeof playback_start_time === 'number'
        ? playback_start_time
        : existingGift?.playback_start_time || 0;
    let resolvedEndTime: number | undefined =
      typeof playback_end_time === 'number'
        ? playback_end_time
        : existingGift?.playback_end_time;
    let resolvedLoopEnabled =
      typeof loop_enabled === 'boolean'
        ? loop_enabled
        : existingGift?.loop_enabled ?? true;

    let finalMusicUrl: string | undefined = undefined;
    let finalMusicTitle: string | undefined = undefined;

    if (resolvedMusicEnabled && resolvedMusicSource !== 'none') {
      if (resolvedMusicSource === 'upload') {
        finalMusicUrl =
          music_url ||
          (resolvedCustomStoragePath ? `/api/gifts/${finalSlug}/audio` : undefined);
        finalMusicTitle =
          resolvedCustomFilename || music_title || 'Personal Custom Audio';
      } else {
        // Library Track
        resolvedMusicSource = 'library';
        const libTrack =
          getMusicTrackById(resolvedLibraryTrackId) || DEFAULT_LIBRARY_TRACK;
        resolvedLibraryTrackId = libTrack.id;
        finalMusicUrl = libTrack.audio_url || '/audio/gentle-moments.mp3';
        finalMusicTitle = libTrack.title;
        if (!resolvedAudioDuration) {
          resolvedAudioDuration = libTrack.duration;
        }
      }
    } else {
      resolvedMusicSource = 'none';
      resolvedMusicEnabled = false;
      finalMusicUrl = undefined;
      finalMusicTitle = undefined;
    }

    const finalThemeConfig = {
      ...(theme_config || existingGift?.theme_config || {}),
      ...(finalPasswordPageConfig ? { password_page: finalPasswordPageConfig } : {}),
      ...(finalExpiryPageConfig ? { expiry_page: finalExpiryPageConfig } : {}),
      music: {
        enabled: resolvedMusicEnabled,
        source: resolvedMusicSource,
        library_track_id: resolvedLibraryTrackId,
        custom_audio_storage_path: resolvedCustomStoragePath,
        custom_audio_filename: resolvedCustomFilename,
        duration: resolvedAudioDuration,
        start_time: resolvedStartTime,
        end_time: resolvedEndTime,
        loop: resolvedLoopEnabled,
        url: finalMusicUrl,
        title: finalMusicTitle,
      },
      sections: sections || existingGift?.sections || [],
      memories: memories || existingGift?.memories || [],
      timeline_entries: timeline_entries || existingGift?.timeline_entries || [],
      quiz_questions: quiz_questions || existingGift?.quiz_questions || [],
      secret_messages: secret_messages || existingGift?.secret_messages || [],
      letters: letters || existingGift?.letters || [],
      wishes: wishes || existingGift?.wishes || [],
    };

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
      theme_config: finalThemeConfig,
      password_page_config: finalPasswordPageConfig,
      expiry_page_config: finalExpiryPageConfig,
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
      music_enabled: resolvedMusicEnabled,
      music_source: resolvedMusicSource,
      library_track_id: resolvedLibraryTrackId,
      custom_audio_storage_path: resolvedCustomStoragePath,
      custom_audio_filename: resolvedCustomFilename,
      audio_duration: resolvedAudioDuration,
      playback_start_time: resolvedStartTime,
      playback_end_time: resolvedEndTime,
      loop_enabled: resolvedLoopEnabled,
      music_url: finalMusicUrl,
      music_title: finalMusicTitle,
      memory_wall_config,
      sections: sections || existingGift?.sections || [],
      memories: memories || existingGift?.memories || [],
      timeline_entries: timeline_entries || existingGift?.timeline_entries || [],
      quiz_questions: quiz_questions || existingGift?.quiz_questions || [],
      secret_messages: secret_messages || existingGift?.secret_messages || [],
      letters: letters || existingGift?.letters || [],
      wishes: wishes || existingGift?.wishes || [],
      created_at: existingGift?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at:
        status === 'published'
          ? existingGift?.published_at || new Date().toISOString()
          : null,
    };

    // Clean up old slug key if slug has been modified
    if (existingGift?.slug && existingGift.slug !== finalSlug) {
      delete MOCK_GIFTS[existingGift.slug];
    }

    // Store in memory repository
    MOCK_GIFTS[finalSlug] = savedGift;

    // Persist to Supabase Database
    try {
      const payload: Record<string, any> = {
        id: finalId,
        owner_id: validOwnerId,
        recipient_name: savedGift.recipient_name,
        title: savedGift.title,
        slug: savedGift.slug,
        event_type: savedGift.event_type,
        event_date: savedGift.event_date || null,
        selected_theme: savedGift.selected_theme || 'dreamy',
        theme_config: finalThemeConfig,
        welcome_heading: savedGift.welcome_heading || null,
        welcome_message: savedGift.welcome_message || null,
        welcome_button_text: savedGift.welcome_button_text || null,
        closing_message: savedGift.closing_message || null,
        expiry_heading: savedGift.expiry_heading || null,
        expiry_message: savedGift.expiry_message || null,
        scratch_card_hidden_text: savedGift.scratch_card_hidden_text || null,
        gift_box_message: savedGift.gift_box_message || null,
        cover_image: savedGift.cover_image || null,
        introduction: savedGift.introduction || null,
        music_url: savedGift.music_url || null,
        music_title: savedGift.music_title || null,
        memory_wall_config: savedGift.memory_wall_config || null,
        status: savedGift.status || 'draft',
        password_hash: savedGift.password_hash || null,
        password_hint: savedGift.password_hint || null,
        password_version: savedGift.password_version || 1,
        expiry_enabled: !!savedGift.expiry_enabled,
        expires_at: savedGift.expiry_enabled ? savedGift.expires_at : null,
        expiry_timezone: savedGift.expiry_timezone || 'Asia/Kolkata',
        published_at: savedGift.published_at || null,
        created_at: savedGift.created_at || new Date().toISOString(),
        updated_at: savedGift.updated_at || new Date().toISOString(),
      };

      // Check whether this card already exists in Supabase
      let isExistingInDb = false;
      if (isValidUuid(finalId)) {
        const { data: checkRow } = await supabaseAdmin
          .from('gifts')
          .select('id')
          .eq('id', finalId)
          .maybeSingle();
        if (checkRow?.id) {
          isExistingInDb = true;
        }
      }

      if (isExistingInDb) {
        let updateQuery = supabaseAdmin
          .from('gifts')
          .update(payload)
          .eq('id', finalId);

        if (validOwnerId) {
          updateQuery = updateQuery.eq('owner_id', validOwnerId);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
          if (updateError.code === '23505') {
            return NextResponse.json(
              { error: 'This custom URL slug is already taken. Please choose a different URL slug.' },
              { status: 409 }
            );
          }
          console.warn('Database update error:', updateError.message);
        }
      } else {
        const { error: insertError } = await supabaseAdmin.from('gifts').insert(payload);
        if (insertError) {
          if (insertError.code === '23505') {
            return NextResponse.json(
              { error: 'This custom URL slug is already taken. Please choose a different URL slug.' },
              { status: 409 }
            );
          }
          console.warn('Database insert error:', insertError.message);
        }
      }
    } catch (dbErr: any) {
      if (dbErr?.code === '23505') {
        return NextResponse.json(
          { error: 'This custom URL slug is already taken. Please choose a different URL slug.' },
          { status: 409 }
        );
      }
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

    if (title !== undefined) {
      const activeLimits = getPlatformContentLimits();
      if (activeLimits.fields.cardTitle.enabled && countWords(title) > activeLimits.fields.cardTitle.maxWords) {
        return NextResponse.json(
          { error: `Card title exceeds the ${activeLimits.fields.cardTitle.maxWords}-word limit.` },
          { status: 400 }
        );
      }
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
