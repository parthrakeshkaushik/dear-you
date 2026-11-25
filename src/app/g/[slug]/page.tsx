import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';
import { getGiftWithChildCollections } from '@/lib/gifts/fetch-gift';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { RecipientUnavailableScreen } from '@/components/recipient/RecipientUnavailableScreen';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gift = await getGiftWithChildCollections(params.slug);
  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    return {
      title: 'Dear You — A Special Surprise',
    };
  }

  return {
    title: `${gift.recipient_name} — ${gift.title} | Dear You`,
    description: `A personal digital surprise crafted for ${gift.recipient_name}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RecipientGiftPage({ params }: PageProps) {
  const { slug } = params;

  // Look up gift in database & mock repository with all child relational collections
  const gift = await getGiftWithChildCollections(slug);

  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    notFound();
  }

  // Check creator status
  const owner = MOCK_USERS.find((u) => u.id === gift.owner_id);
  const isCreatorSuspended = owner?.account_status === 'suspended';

  // Check Moderation Status
  const isModeratedUnavailable =
    gift.moderation_status === 'paused' ||
    gift.moderation_status === 'unpublished' ||
    gift.status !== 'published' ||
    isCreatorSuspended;

  if (isModeratedUnavailable) {
    return (
      <RecipientUnavailableScreen
        themeId={gift.selected_theme}
        customConfig={gift.theme_config}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <RecipientExperience gift={gift} />
    </div>
  );
}
