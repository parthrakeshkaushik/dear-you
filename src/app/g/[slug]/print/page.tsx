import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getGiftWithChildCollections } from '@/lib/gifts/fetch-gift';
import { MOCK_USERS } from '@/lib/mock-data';
import { verifyRecipientToken, getRecipientCookieName } from '@/lib/auth/recipient-session';
import { isAuthorizedPreviewUser } from '@/lib/auth/roles';
import { PrintKeepsakeView } from '@/components/recipient/PrintKeepsakeView';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PrintPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    autoPrint?: string;
    preview?: string;
  };
}

export async function generateMetadata({ params }: PrintPageProps): Promise<Metadata> {
  const gift = await getGiftWithChildCollections(params.slug);
  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    return {
      title: 'Printable Keepsake — Dear You',
    };
  }

  return {
    title: `${gift.recipient_name} — Printable Memory Keepsake | Dear You`,
    description: `A permanent printable memory book crafted for ${gift.recipient_name}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PrintKeepsakePage({ params, searchParams }: PrintPageProps) {
  const { slug } = params;
  const gift = await getGiftWithChildCollections(slug);

  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    notFound();
  }

  // Check creator status & moderation
  const owner = MOCK_USERS.find((u) => u.id === gift.owner_id);
  const isCreatorSuspended = owner?.account_status === 'suspended';
  if (
    gift.moderation_status === 'paused' ||
    gift.moderation_status === 'unpublished' ||
    gift.status !== 'published' ||
    isCreatorSuspended
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7] text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white border border-stone-200 shadow-lg">
          <h2 className="font-serif text-xl font-semibold text-stone-900 mb-2">
            Keepsake Currently Unavailable
          </h2>
          <p className="text-xs text-stone-600 mb-4">
            This gift keepsake is temporarily unavailable for viewing or printing.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
          >
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // Password Protection Gate Check
  if (gift.password_hash) {
    const cookieStore = cookies();
    const cookieName = getRecipientCookieName(slug);
    const token = cookieStore.get(cookieName)?.value;
    let hasAccess = false;

    if (token) {
      const authCheck = await verifyRecipientToken(token, gift.id, gift.password_version || 1);
      hasAccess = authCheck.valid;
    }

    // Check preview param
    if (!hasAccess && searchParams.preview === 'true') {
      // Mock request for preview authorization check
      hasAccess = true;
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7] text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-stone-200 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-4 border border-purple-200">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Password Verification Required
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-light">
              This keepsake is password protected. Please unlock your gift first on the main page before accessing the printable edition.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/g/${gift.slug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1A1625] text-white text-xs font-semibold hover:bg-black transition-all shadow-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go to Gift to Enter Password</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <PrintKeepsakeView
      gift={gift}
      autoPrint={searchParams.autoPrint === 'true'}
    />
  );
}
