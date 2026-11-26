import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getVerifiedUserFromCookies } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gifts/audio/delete
 * Safely deletes an unreferenced or replaced custom audio file.
 * Validates path formatting to prevent path traversal.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { storage_path } = body;

    if (!storage_path || typeof storage_path !== 'string') {
      return NextResponse.json({ error: 'storage_path is required.' }, { status: 400 });
    }

    // Security check: Must start with gift-audio/ and contain no path traversal characters
    if (!storage_path.startsWith('gift-audio/') || storage_path.includes('..')) {
      return NextResponse.json({ error: 'Invalid storage path.' }, { status: 400 });
    }

    // 1. Remove from Supabase Storage
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.storage.from('gifts').remove([storage_path]);
    } catch (err) {
      console.warn('Storage deletion warning:', err);
    }

    // 2. Remove from local fallback storage if present
    try {
      const relativePart = storage_path.replace('gift-audio/', '');
      const localPath = path.join(process.cwd(), 'public', 'uploads', 'audio', relativePart);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {
      console.warn('Local file cleanup warning:', err);
    }

    return NextResponse.json({ success: true, message: 'Audio removed safely.' });
  } catch (error: any) {
    console.error('Audio delete route error:', error);
    return NextResponse.json({ error: error.message || 'Deletion error' }, { status: 500 });
  }
}
