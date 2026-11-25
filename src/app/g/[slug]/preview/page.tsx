import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { verifySessionExpiryToken, SESSION_COOKIE_NAME } from '@/lib/auth/persistent-session';
import { isAuthorizedDeveloperEmail } from '@/lib/auth/roles';
import { getGiftWithChildCollections } from '@/lib/gifts/fetch-gift';
import { Gift } from '@/types/gift';
import { Eye, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function GiftPreviewPage({ params }: PageProps) {
  const { slug } = params;

  // 1. Authenticate user from session cookies
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let authenticatedUserId: string | null = null;
  let authenticatedUserEmail: string | null = null;
  let isDeveloper = false;

  if (sessionCookie) {
    const sessionCheck = await verifySessionExpiryToken(sessionCookie);
    if (sessionCheck.valid && sessionCheck.userId) {
      authenticatedUserId = sessionCheck.userId;
      authenticatedUserEmail = sessionCheck.email || null;
      if (
        sessionCheck.role === 'developer' ||
        isAuthorizedDeveloperEmail(authenticatedUserEmail)
      ) {
        isDeveloper = true;
      }
    }
  }

  // Fallback to Supabase SSR cookie session
  if (!authenticatedUserId) {
    try {
      const supabase = createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;
        authenticatedUserEmail = user.email || null;
        if (
          user.app_metadata?.role === 'developer' ||
          isAuthorizedDeveloperEmail(authenticatedUserEmail)
        ) {
          isDeveloper = true;
        }
      }
    } catch {}
  }

  // If user is completely unauthenticated, redirect to login
  if (!authenticatedUserId) {
    redirect(`/login?redirect=/g/${encodeURIComponent(slug)}/preview`);
  }

  // 2. Fetch gift with all child relational collections (sections, memories, timeline, letters, quiz, etc.)
  const gift = await getGiftWithChildCollections(slug);

  if (!gift) {
    notFound();
  }

  const isDemoCard = gift.is_demo === true || slug === 'demo' || slug === 'demo-gift';
  const isOwner = gift.owner_id === authenticatedUserId;

  // 3. Strict Server-Side Ownership Enforcement:
  // Only the gift's authenticated owner, an authorized platform developer, or the demo card can access preview
  if (!isOwner && !isDeveloper && !isDemoCard) {
    // Attempting to access another user's draft or gift preview is strictly denied
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating Admin Preview Banner */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-stone-900/90 text-white text-xs font-medium shadow-xl border border-white/10 backdrop-blur-md">
        <Eye className="w-3.5 h-3.5 text-amber-400" />
        <span>Creator Preview Mode • Unlocked</span>
        <Link
          href="/admin/gifts"
          className="ml-2 pl-2 border-l border-white/20 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit</span>
        </Link>
      </div>

      <RecipientExperience gift={gift} initialUnlocked={true} isPreview={true} />
    </div>
  );
}
