import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Background auto-confirm helper.
 * If an existing account had email_confirm: false from prior OTP testing,
 * this endpoint immediately marks them confirmed so they can log in seamlessly
 * without encountering "Email not confirmed" errors or OTP blocks.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = createAdminClient();

    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (user && !user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          email_verified: true,
        },
      });
      return NextResponse.json({ success: true, confirmed: true });
    }

    return NextResponse.json({ success: true, confirmed: !!user?.email_confirmed_at });
  } catch (error: any) {
    console.warn('Auto-confirm helper error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
