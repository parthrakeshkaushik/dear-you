import { NextRequest, NextResponse } from 'next/server';
import { DEAR_YOU_MUSIC_LIBRARY, MusicTrack } from '@/config/music-library';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVerifiedUserFromCookies } from '@/lib/auth/server-auth';

/**
 * GET /api/music/library
 * Returns the platform's pre-approved background music library tracks.
 * Queries Supabase database if available; falls back to static catalog.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let tracks: MusicTrack[] = [...DEAR_YOU_MUSIC_LIBRARY];

    // Try fetching database-managed tracks
    try {
      const supabaseAdmin = createAdminClient();
      const { data: dbTracks, error } = await supabaseAdmin
        .from('music_tracks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (dbTracks && dbTracks.length > 0 && !error) {
        // Map database records to MusicTrack interface
        const mapped = dbTracks.map((t: any) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          duration: Number(t.duration),
          durationFormatted: `${Math.floor(Number(t.duration) / 60)}:${Math.floor(Number(t.duration) % 60).toString().padStart(2, '0')}`,
          artist: t.artist || 'Dear You Music',
          attribution: t.attribution || undefined,
          audio_url: t.audio_url,
          description: t.description || '',
          is_active: t.is_active,
          display_order: t.display_order || 0,
        }));
        tracks = mapped;
      }
    } catch (dbErr) {
      // Fallback silently to static library
    }

    if (category && category !== 'All') {
      tracks = tracks.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      tracks,
      total: tracks.length,
    });
  } catch (error: any) {
    console.error('Music library fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load music library.', tracks: DEAR_YOU_MUSIC_LIBRARY },
      { status: 500 }
    );
  }
}

/**
 * POST /api/music/library
 * Developer route to add or update music tracks in the platform library.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUserFromCookies();
    if (!user || user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized. Developer privileges required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, title, category, duration, artist, attribution, audio_url, description, is_active, display_order } = body;

    if (!title || !category || !duration || !audio_url) {
      return NextResponse.json({ error: 'Missing required track fields.' }, { status: 400 });
    }

    const trackId = id || `lib-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('music_tracks')
      .upsert({
        id: trackId,
        title,
        category,
        duration: Number(duration),
        artist: artist || 'Dear You Music',
        attribution: attribution || null,
        audio_url,
        description: description || null,
        is_active: typeof is_active === 'boolean' ? is_active : true,
        display_order: Number(display_order) || 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, track: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
