import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateSlugFormat, normalizeSlug } from '@/lib/gifts/slug-rules';

export async function GET(request: NextRequest) {
  try {
    const rawSlug = request.nextUrl.searchParams.get('slug') || '';
    const currentGiftId = request.nextUrl.searchParams.get('currentGiftId') || null;

    // 1. Format and reserved route validation
    const validation = validateSlugFormat(rawSlug);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        valid: false,
        reason: validation.error,
        normalized: validation.normalized,
      });
    }

    const normalizedSlug = validation.normalized;

    // 2. Check in-memory repository for collision
    const existingMemGift =
      MOCK_GIFTS[normalizedSlug] ||
      Object.values(MOCK_GIFTS).find((g) => g.slug === normalizedSlug);

    if (existingMemGift) {
      if (currentGiftId && existingMemGift.id === currentGiftId) {
        return NextResponse.json({
          available: true,
          valid: true,
          normalized: normalizedSlug,
          isCurrentGift: true,
          message: 'Current URL of this gift.',
        });
      }

      return NextResponse.json({
        available: false,
        valid: true,
        reason: 'This URL is already taken. Please choose another one.',
        normalized: normalizedSlug,
      });
    }

    // 3. Check Supabase database
    try {
      const supabaseAdmin = createAdminClient();
      const { data: dbGift, error: dbErr } = await supabaseAdmin
        .from('gifts')
        .select('id, slug')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (dbErr && dbErr.code !== 'PGRST116') {
        console.warn('Slug check database lookup warning:', dbErr.message);
      }

      if (dbGift) {
        if (currentGiftId && dbGift.id === currentGiftId) {
          return NextResponse.json({
            available: true,
            valid: true,
            normalized: normalizedSlug,
            isCurrentGift: true,
            message: 'Current URL of this gift.',
          });
        }

        return NextResponse.json({
          available: false,
          valid: true,
          reason: 'This URL is already taken. Please choose another one.',
          normalized: normalizedSlug,
        });
      }
    } catch (dbCheckErr) {
      console.warn('Slug check database exception:', dbCheckErr);
    }

    // 4. Slug is free and valid!
    return NextResponse.json({
      available: true,
      valid: true,
      normalized: normalizedSlug,
      isCurrentGift: false,
      message: 'This URL is available!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { available: false, valid: false, reason: error.message || 'Error validating URL slug.' },
      { status: 500 }
    );
  }
}
