import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { getMusicTrackById, DEFAULT_LIBRARY_TRACK } from '@/config/music-library';
import { Gift } from '@/types/gift';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gifts/[slug]/audio
 * Streams the dedicated, authorized background audio for an unlocked recipient gift.
 * Handles library tracks and custom uploaded songs with HTTP Range requests.
 * Returns 404 if music is disabled for the gift.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 1. Fetch Gift
    let gift: Gift | null = null;
    try {
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin
        .from('gifts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (data && !error) {
        gift = data as Gift;
      }
    } catch {}

    if (!gift) {
      gift = MOCK_GIFTS[slug] || null;
    }

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found.' }, { status: 404 });
    }

    // 2. Check if music is disabled
    const musicSource = gift.music_source || (gift.music_url ? 'library' : 'none');
    const isEnabled = gift.music_enabled !== false && musicSource !== 'none';

    if (!isEnabled) {
      return new NextResponse(null, { status: 404, statusText: 'No Music Configured' });
    }

    let audioBuffer: Buffer | null = null;
    let contentType = 'audio/mpeg';

    // 3. Resolve Custom Upload
    if (musicSource === 'upload' && gift.custom_audio_storage_path) {
      const storagePath = gift.custom_audio_storage_path;
      if (storagePath.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      }

      // Try Supabase Storage first
      try {
        const supabaseAdmin = createAdminClient();
        const { data: blobData, error: dlErr } = await supabaseAdmin.storage
          .from('gifts')
          .download(storagePath);

        if (blobData && !dlErr) {
          audioBuffer = Buffer.from(await blobData.arrayBuffer());
        }
      } catch (err) {
        console.warn('Supabase storage download note:', err);
      }

      // Try local upload fallback
      if (!audioBuffer) {
        const relativePart = storagePath.replace('gift-audio/', '');
        const localPath = path.join(process.cwd(), 'public', 'uploads', 'audio', relativePart);
        if (fs.existsSync(localPath)) {
          audioBuffer = fs.readFileSync(localPath);
        }
      }
    }

    // 4. Resolve Library Track (or fallback)
    if (!audioBuffer) {
      const track = getMusicTrackById(gift.library_track_id) || DEFAULT_LIBRARY_TRACK;
      const audioUrl = track?.audio_url || gift.music_url || '/audio/gentle-moments.mp3';
      const cleanPath = audioUrl.startsWith('/') ? audioUrl.slice(1) : audioUrl;
      const localAudioFile = path.join(process.cwd(), 'public', cleanPath);

      if (fs.existsSync(localAudioFile)) {
        audioBuffer = fs.readFileSync(localAudioFile);
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return new NextResponse(null, { status: 404, statusText: 'Audio Not Found' });
    }

    const totalSize = audioBuffer.length;
    const rangeHeader = request.headers.get('range');

    // 5. Handle HTTP 206 Partial Content (Range requests for seeking and smooth streaming)
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
          },
        });
      }

      const chunk = audioBuffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunk.length.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // 6. Full Audio Response (HTTP 200)
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': totalSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('Audio streaming error:', error);
    return new NextResponse(null, { status: 500, statusText: 'Audio Stream Error' });
  }
}
