import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const {
      expiry_enabled = false,
      expires_at = null,
      expiry_timezone = 'Asia/Kolkata',
      expiry_heading,
      expiry_message,
    } = body;

    const gift = MOCK_GIFTS[slug];
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    // 1. Update In-Memory / Object Record
    gift.status = 'published';
    gift.moderation_status = 'active';
    gift.expiry_enabled = Boolean(expiry_enabled);
    gift.expires_at = expiry_enabled ? expires_at : null;
    gift.expiry_timezone = expiry_timezone;
    if (expiry_heading) gift.expiry_heading = expiry_heading;
    if (expiry_message) gift.expiry_message = expiry_message;
    gift.republished_at = nowIso;
    gift.updated_at = nowIso;

    // 2. Persist to Supabase database if connected
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin
        .from('gifts')
        .update({
          status: 'published',
          moderation_status: 'active',
          expiry_enabled: Boolean(expiry_enabled),
          expires_at: expiry_enabled ? expires_at : null,
          expiry_timezone,
          expiry_heading: gift.expiry_heading,
          expiry_message: gift.expiry_message,
          republished_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', gift.id);

      // Audit Log Entry
      await supabaseAdmin.from('developer_audit_logs').insert({
        developer_email: 'creator@republish',
        action_type: 'gift_republished',
        target_gift_id: gift.id,
        target_gift_title: gift.title,
        details: {
          previous_status: 'expired',
          new_status: 'published',
          expiry_enabled: Boolean(expiry_enabled),
          new_expires_at: expiry_enabled ? expires_at : null,
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch (dbErr) {
      console.warn('Database republish persistence note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `"${gift.title}" has been republished successfully! The recipient can now visit /g/${gift.slug} again.`,
      gift,
    });
  } catch (error: any) {
    console.error('Republish gift error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to republish gift.' },
      { status: 500 }
    );
  }
}
