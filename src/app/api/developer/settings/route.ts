import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper, logDeveloperAction } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPlatformContentLimits,
  updatePlatformContentLimits,
  DEFAULT_CONTENT_LIMITS,
  PlatformContentLimits,
} from '@/lib/config/content-limits';

export async function GET(request: NextRequest) {
  // Public or developer check: limits can be queried by anyone (including creator studio),
  // but developer check informs administrative capabilities
  const authCheck = await getAuthenticatedDeveloper(request);

  try {
    const supabaseAdmin = createAdminClient();
    const { data: dbSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'content_limits')
      .maybeSingle();

    if (dbSetting?.setting_value) {
      updatePlatformContentLimits(dbSetting.setting_value);
    }
  } catch (err) {
    // Non-blocking fallback to in-memory limits
  }

  const limits = getPlatformContentLimits();
  return NextResponse.json({
    limits,
    isDeveloper: authCheck.isDeveloper,
    developerEmail: authCheck.email,
  });
}

export async function POST(request: NextRequest) {
  const authCheck = await getAuthenticatedDeveloper(request);

  if (!authCheck.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Platform Developer access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const previousLimits = getPlatformContentLimits();

    const maxPhotos =
      typeof body.maxPhotos === 'number' && body.maxPhotos > 0
        ? Math.floor(body.maxPhotos)
        : previousLimits.maxPhotos;

    const fields = { ...previousLimits.fields };

    if (body.fields && typeof body.fields === 'object') {
      for (const [key, val] of Object.entries(body.fields)) {
        if (key in fields && val && typeof val === 'object') {
          const fieldConfig = val as { maxWords?: number; enabled?: boolean };
          fields[key as keyof typeof fields] = {
            ...fields[key as keyof typeof fields],
            maxWords:
              typeof fieldConfig.maxWords === 'number' && fieldConfig.maxWords > 0
                ? Math.floor(fieldConfig.maxWords)
                : fields[key as keyof typeof fields].maxWords,
            enabled:
              typeof fieldConfig.enabled === 'boolean'
                ? fieldConfig.enabled
                : fields[key as keyof typeof fields].enabled,
          };
        }
      }
    }

    const updated = updatePlatformContentLimits(
      {
        maxPhotos,
        fields,
      },
      authCheck.email
    );

    // Persist to Supabase platform_settings table if possible
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from('platform_settings').upsert({
        setting_key: 'content_limits',
        setting_value: updated,
        updated_at: new Date().toISOString(),
        updated_by: authCheck.email,
      });
    } catch (dbErr) {
      console.warn('Could not persist content_limits to Supabase:', dbErr);
    }

    // Log developer administrative action in audit trail
    await logDeveloperAction({
      developerId: authCheck.userId,
      developerEmail: authCheck.email || 'developer',
      actionType: 'modify_platform_settings',
      details: {
        setting: 'content_limits',
        maxPhotos,
        modifiedFieldsCount: Object.keys(body.fields || {}).length,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Platform content limits updated successfully.',
      limits: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
