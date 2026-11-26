import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { checkGiftExpiry } from '@/lib/expiry';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { isAuthorizedPreviewUser } from '@/lib/auth/roles';
import { generateOfflineCardHtml } from '@/lib/download/generate-offline-card';
import { createAdminClient } from '@/lib/supabase/admin';
import { Gift } from '@/types/gift';
import { getMusicTrackById, DEFAULT_LIBRARY_TRACK } from '@/config/music-library';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

/**
 * Robust asset fetcher: handles base64 data URIs, local files in public/, and remote URLs.
 */
async function fetchAssetBuffer(
  assetUrl: string,
  baseOrigin?: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    if (!assetUrl) return null;

    // 1. Data URI
    if (assetUrl.startsWith('data:')) {
      const commaIdx = assetUrl.indexOf(',');
      if (commaIdx === -1) return null;
      const meta = assetUrl.slice(0, commaIdx);
      const base64Data = assetUrl.slice(commaIdx + 1);
      const mimeMatch = meta.match(/data:([^;]+)/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      return {
        buffer: Buffer.from(base64Data, 'base64'),
        contentType,
      };
    }

    // 2. Local public file (e.g., /brand/logo.png)
    if (assetUrl.startsWith('/') && !assetUrl.startsWith('//')) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const localPath = path.join(process.cwd(), 'public', assetUrl.replace(/^\//, ''));
        const buffer = await fs.readFile(localPath);
        const ext = path.extname(localPath).toLowerCase().replace('.', '');
        const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        return { buffer, contentType };
      } catch {
        if (baseOrigin) {
          assetUrl = `${baseOrigin}${assetUrl}`;
        } else {
          return null;
        }
      }
    }

    // 3. Remote URL (http / https)
    if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
      const res = await fetch(assetUrl, {
        headers: { 'User-Agent': 'DearYou-OfflineAssetPackager/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      };
    }

    return null;
  } catch (err) {
    console.warn('Asset fetch notice for URL:', assetUrl, err);
    return null;
  }
}

function getExtFromContentTypeOrUrl(contentType?: string, url?: string): string {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('svg')) return 'svg';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  if (contentType?.includes('audio/mpeg') || contentType?.includes('mp3')) return 'mp3';
  if (contentType?.includes('audio/wav')) return 'wav';
  if (url) {
    const clean = url.split('?')[0].split('#')[0];
    const match = clean.match(/\.([a-zA-Z0-9]{3,4})$/);
    if (match) return match[1].toLowerCase();
  }
  return 'jpg';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 1. Fetch gift from Supabase database first, fallback to mock data
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
    } catch (dbErr) {
      console.warn('Database query note in download route:', dbErr);
    }

    if (!gift) {
      gift = MOCK_GIFTS[slug] || null;
    }

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    // 2. Check Moderation & Soft-Deletion
    if (gift.moderation_status === 'deleted' || (gift as any).deleted_at) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    if (
      gift.moderation_status === 'paused' ||
      gift.moderation_status === 'unpublished' ||
      gift.status !== 'published'
    ) {
      return NextResponse.json(
        {
          error: 'This gift is currently unavailable for download.',
          isUnavailable: true,
        },
        { status: 423 }
      );
    }

    // 3. Check Creator Status
    const owner = MOCK_USERS.find((u) => u.id === gift!.owner_id);
    if (owner && owner.account_status === 'suspended') {
      return NextResponse.json(
        {
          error: 'This gift is currently unavailable.',
          isUnavailable: true,
        },
        { status: 423 }
      );
    }

    // 4. Strict Server-Side Expiry Enforcement
    const expiry = checkGiftExpiry(gift.expiry_enabled, gift.expires_at, gift.expiry_timezone);
    if (expiry.isExpired) {
      return NextResponse.json(
        {
          error:
            'This online gift has expired and cannot be downloaded online. However, if you previously downloaded an offline package, that saved copy can still be opened on your device.',
          isExpired: true,
        },
        { status: 410 }
      );
    }

    // 5. Password Protection Check
    const cookieName = getRecipientCookieName(slug);
    const token = request.cookies.get(cookieName)?.value;
    const wantsPreview = request.nextUrl.searchParams.get('preview') === 'true';

    let isAuthorizedPreview = false;
    if (wantsPreview) {
      const authPreview = await isAuthorizedPreviewUser(request, gift.owner_id);
      isAuthorizedPreview = authPreview.isAuthorized;
    }

    let hasAccess = false;
    let isPasswordRevoked = false;
    if (token) {
      const authCheck = await verifyRecipientToken(token, gift.id, gift.password_version || 1);
      hasAccess = authCheck.valid;
      isPasswordRevoked = !!authCheck.passwordRevoked;
    }

    if (gift.password_hash && !hasAccess && !isAuthorizedPreview) {
      const response = NextResponse.json(
        {
          error: isPasswordRevoked
            ? 'The card password has been updated. Please enter the new password to continue.'
            : 'Password verification required to download this gift.',
          requiresPassword: true,
          passwordRevoked: isPasswordRevoked,
        },
        { status: 401 }
      );
      if (isPasswordRevoked) {
        response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
      }
      return response;
    }

    // 6. Initialize ZIP archive
    const zip = new JSZip();
    const baseOrigin = request.nextUrl.origin;

    // Clone gift for offline packaging with rewritten relative asset paths
    const packagedGift: Gift = JSON.parse(JSON.stringify(gift));

    // A. Package Cover Photograph
    if (gift.cover_image) {
      const coverAsset = await fetchAssetBuffer(gift.cover_image, baseOrigin);
      if (coverAsset) {
        const ext = getExtFromContentTypeOrUrl(coverAsset.contentType, gift.cover_image);
        const fileName = `cover.${ext}`;
        zip.file(`assets/images/${fileName}`, coverAsset.buffer);
        packagedGift.cover_image = `./assets/images/${fileName}`;
      }
    }

    // B. Package Memories & Photos
    if (Array.isArray(gift.memories) && gift.memories.length > 0) {
      for (let i = 0; i < gift.memories.length; i++) {
        const memory = gift.memories[i];
        if (memory?.image_path) {
          const photoAsset = await fetchAssetBuffer(memory.image_path, baseOrigin);
          if (photoAsset) {
            const ext = getExtFromContentTypeOrUrl(photoAsset.contentType, memory.image_path);
            const fileName = `photo-${i + 1}.${ext}`;
            zip.file(`assets/images/${fileName}`, photoAsset.buffer);
            if (packagedGift.memories && packagedGift.memories[i]) {
              packagedGift.memories[i].image_path = `./assets/images/${fileName}`;
            }
          }
        }
      }
    }

    // C. Package Background Audio (strictly independent per gift)
    const isMusicEnabled =
      gift.music_enabled !== false &&
      gift.music_source !== 'none' &&
      (Boolean(gift.music_url) || Boolean(gift.library_track_id) || Boolean(gift.custom_audio_storage_path));

    if (!isMusicEnabled) {
      packagedGift.music_url = undefined;
      packagedGift.music_enabled = false;
      packagedGift.music_source = 'none';
    } else {
      let audioBuffer: Buffer | null = null;
      let audioExt = 'mp3';

      // 1. Uploaded Custom Audio: Fetch from Supabase Storage or local fallback directory
      if (gift.music_source === 'upload' && gift.custom_audio_storage_path) {
        if (gift.custom_audio_storage_path.endsWith('.m4a')) audioExt = 'm4a';

        try {
          const supabaseAdmin = createAdminClient();
          const { data: blob } = await supabaseAdmin.storage
            .from('gifts')
            .download(gift.custom_audio_storage_path);
          if (blob) {
            audioBuffer = Buffer.from(await blob.arrayBuffer());
          }
        } catch (storageDlErr) {
          console.warn('Storage download note during ZIP packaging:', storageDlErr);
        }

        if (!audioBuffer) {
          const relPath = gift.custom_audio_storage_path.replace('gift-audio/', '');
          const localUpload = path.join(process.cwd(), 'public', 'uploads', 'audio', relPath);
          if (fsSync.existsSync(localUpload)) {
            audioBuffer = fsSync.readFileSync(localUpload);
          }
        }
      }

      // 2. Library Track or URL fallback
      if (!audioBuffer) {
        const track = getMusicTrackById(gift.library_track_id) || DEFAULT_LIBRARY_TRACK;
        const targetUrl = track?.audio_url || gift.music_url || '/audio/gentle-moments.mp3';
        const audioAsset = await fetchAssetBuffer(targetUrl, baseOrigin);
        if (audioAsset) {
          audioBuffer = audioAsset.buffer;
          const ext = getExtFromContentTypeOrUrl(audioAsset.contentType, targetUrl);
          audioExt = ext === 'm4a' ? 'm4a' : 'mp3';
        }
      }

      if (audioBuffer) {
        const fileName = `background.${audioExt}`;
        zip.file(`assets/audio/${fileName}`, audioBuffer);
        packagedGift.music_url = `./assets/audio/${fileName}`;
        packagedGift.music_enabled = true;
      } else {
        packagedGift.music_url = undefined;
      }
    }

    // D. Package Structured Gift Data (Sanitized of password hashes)
    const sanitizedGiftData = {
      id: gift.id,
      title: gift.title,
      slug: gift.slug,
      recipient_name: gift.recipient_name,
      event_type: gift.event_type,
      event_date: gift.event_date,
      introduction: gift.introduction,
      welcome_heading: gift.welcome_heading,
      welcome_message: gift.welcome_message,
      welcome_button_text: gift.welcome_button_text,
      selected_theme: gift.selected_theme,
      theme_config: gift.theme_config,
      gift_box_message: gift.gift_box_message,
      scratch_card_hidden_text: gift.scratch_card_hidden_text,
      closing_message: gift.closing_message,
      music_enabled: packagedGift.music_enabled,
      music_source: packagedGift.music_source,
      music_url: packagedGift.music_url,
      music_title: packagedGift.music_title,
      playback_start_time: packagedGift.playback_start_time,
      playback_end_time: packagedGift.playback_end_time,
      loop_enabled: packagedGift.loop_enabled,
      memories: packagedGift.memories || [],
      timeline_entries: gift.timeline_entries || [],
      quiz_questions: gift.quiz_questions || [],
      secret_messages: gift.secret_messages || [],
      letters: gift.letters || [],
      wishes: gift.wishes || [],
      created_at: gift.created_at,
      exported_at: new Date().toISOString(),
      platform: 'Dear You (https://dear-you-wine.vercel.app)',
    };
    zip.file('data/gift-data.json', JSON.stringify(sanitizedGiftData, null, 2));

    // E. Generate Standalone Offline HTML with rewritten relative asset paths
    const offlineHtml = generateOfflineCardHtml(packagedGift);
    zip.file('index.html', offlineHtml);

    // F. Package Detailed README.txt with permanent offline disclosure
    const readmeContent = `======================================================================
DEAR YOU — PERMANENT PERSONAL KEEPSAKE PACKAGE
Special Surprise Crafted for: ${gift.recipient_name}
Title: ${gift.title}
Created on Dear You • https://dear-you-wine.vercel.app
======================================================================

Dear ${gift.recipient_name},

This package contains your permanent, self-contained offline memory book.

FOLDER CONTENTS:
- index.html: Double-click to open your interactive memory book in any web browser.
- assets/images/: All original photographs and memory cards safely preserved offline.
- assets/audio/: Preserved background music (if included in your gift).
- data/gift-data.json: Complete structured keepsake data.
- README.txt: This instructions and guarantee file.

PERMANENT OFFLINE GUARANTEE:
- 100% Offline: This gift is completely self-contained on your device. You can open and enjoy it anytime without an internet connection.
- Permanent Keepsake: Once downloaded, this offline copy is yours forever. It cannot be remotely expired, edited, revoked, or deleted by anyone, even if the online link reaches its scheduled conclusion.
- Safe Preservation: You may freely copy this folder to a USB drive, your phone/tablet/computer, or your personal cloud storage (Google Drive, iCloud, OneDrive) to preserve these memories for a lifetime.

HOW TO EXPLORE:
1. Double-click the "index.html" file.
2. It will open in your default browser (Chrome, Safari, Edge, Firefox, etc.).
3. Interact with the gift: unwrap the surprise box, scratch to reveal secret messages, view photos in the lightbox, answer quiz questions, and read personal letters!

Crafted with love on Dear You.
`;
    zip.file('README.txt', readmeContent);

    // Generate ZIP file buffer
    const zipUint8Array = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // 7. Update Download Count & Audit Log
    try {
      gift.download_count = (gift.download_count || 0) + 1;
      gift.last_downloaded_at = new Date().toISOString();

      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from('gifts')
        .update({
          download_count: gift.download_count,
          last_downloaded_at: gift.last_downloaded_at,
        })
        .eq('id', gift.id);

      await supabaseAdmin.from('developer_audit_logs').insert({
        developer_email: 'recipient@download',
        action_type: 'gift_downloaded',
        target_gift_id: gift.id,
        target_gift_title: gift.title,
        details: {
          recipient_name: gift.recipient_name,
          slug: gift.slug,
          format: 'zip',
          photos_bundled: gift.memories?.length || 0,
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch (dbErr) {
      console.warn('Download tracking notice:', dbErr);
    }

    // 8. Stream ZIP download to recipient
    return new NextResponse(zipUint8Array as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="dear-you-${gift.slug}-keepsake.zip"`,
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Length': zipUint8Array.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download card error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating download package.' },
      { status: 500 }
    );
  }
}
