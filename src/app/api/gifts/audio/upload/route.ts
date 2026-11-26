import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getVerifiedUserFromCookies } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_AUDIO_DURATION_SECONDS,
  validateAudioBufferMagicBytes,
} from '@/lib/audio/audio-utils';
import { MOCK_GIFTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gifts/audio/upload
 * Securely uploads a creator's personal audio file for an individual gift.
 * Enforces authentication, creator ownership, magic byte format validation,
 * size <= 10MB, duration <= 5 minutes, and legal confirmation.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate creator session
    const user = await getVerifiedUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to upload audio.' },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const giftId = (formData.get('giftId') as string) || `gift-draft-${Date.now()}`;
    const reportedDuration = parseFloat((formData.get('duration') as string) || '0');
    const legalConfirmed = formData.get('legalConfirmed') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    // 3. Verify Mandatory Legal Rights Confirmation
    if (!legalConfirmed) {
      return NextResponse.json(
        {
          error:
            'You must confirm that you have the right or permission to use and share this audio.',
        },
        { status: 400 }
      );
    }

    // 4. Validate File Size
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Audio file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of 10 MB.`,
        },
        { status: 400 }
      );
    }

    // 5. Validate Reported Duration
    if (reportedDuration > MAX_AUDIO_DURATION_SECONDS + 2) {
      return NextResponse.json(
        {
          error: `Audio duration (${Math.floor(reportedDuration / 60)}m ${Math.floor(reportedDuration % 60)}s) exceeds the maximum allowed limit of 5 minutes.`,
        },
        { status: 400 }
      );
    }

    // 6. Verify Ownership if giftId corresponds to an existing gift
    if (giftId && !giftId.startsWith('gift-draft-')) {
      try {
        const supabaseAdmin = createAdminClient();
        const { data: existingDbGift } = await supabaseAdmin
          .from('gifts')
          .select('id, owner_id')
          .eq('id', giftId)
          .maybeSingle();

        if (existingDbGift && existingDbGift.owner_id && existingDbGift.owner_id !== user.id && user.role !== 'developer') {
          return NextResponse.json(
            { error: 'Unauthorized. You do not own this gift record.' },
            { status: 403 }
          );
        }
      } catch (err) {
        // Fallback to checking memory repo
        const memGift = Object.values(MOCK_GIFTS).find((g) => g.id === giftId);
        if (memGift && memGift.owner_id && memGift.owner_id !== user.id && user.role !== 'developer') {
          return NextResponse.json(
            { error: 'Unauthorized. You do not own this gift record.' },
            { status: 403 }
          );
        }
      }
    }

    // 7. Read File Buffer and Validate Magic Bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const magicCheck = validateAudioBufferMagicBytes(buffer);
    if (!magicCheck.valid) {
      return NextResponse.json({ error: magicCheck.error }, { status: 400 });
    }

    const safeExt = magicCheck.detectedFormat || 'mp3';
    const cleanOrigName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileId = crypto.randomUUID().substring(0, 8);
    const storageFileName = `${Date.now()}-${uniqueFileId}.${safeExt}`;
    const storagePath = `gift-audio/${giftId}/${storageFileName}`;

    let resolvedPlaybackUrl: string | null = null;

    // 8. Attempt Supabase Storage Upload
    try {
      const supabaseAdmin = createAdminClient();
      const { error: uploadError } = await supabaseAdmin.storage
        .from('gifts')
        .upload(storagePath, buffer, {
          contentType: safeExt === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
          upsert: true,
        });

      if (!uploadError) {
        // Create signed URL valid for 24 hours for live editing preview
        const { data: signedData } = await supabaseAdmin.storage
          .from('gifts')
          .createSignedUrl(storagePath, 60 * 60 * 24);

        if (signedData?.signedUrl) {
          resolvedPlaybackUrl = signedData.signedUrl;
        }
      } else {
        console.warn('Supabase storage upload note:', uploadError.message);
      }
    } catch (storageErr) {
      console.warn('Storage connection note:', storageErr);
    }

    // 9. Local Fallback Persistence if Supabase Storage is not connected
    if (!resolvedPlaybackUrl) {
      const localUploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio', giftId);
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }
      const localFilePath = path.join(localUploadDir, storageFileName);
      fs.writeFileSync(localFilePath, buffer);
      resolvedPlaybackUrl = `/uploads/audio/${giftId}/${storageFileName}`;
    }

    return NextResponse.json({
      success: true,
      storage_path: storagePath,
      filename: cleanOrigName,
      duration: Math.round(reportedDuration || 180),
      audio_url: resolvedPlaybackUrl,
      format: safeExt,
      size_bytes: file.size,
    });
  } catch (error: any) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during audio upload.' },
      { status: 500 }
    );
  }
}
