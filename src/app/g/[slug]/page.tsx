import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { Gift } from '@/types/gift';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gift = MOCK_GIFTS[params.slug];
  if (!gift) {
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
  
  // Look up gift in repository/mock
  const gift = MOCK_GIFTS[slug];

  if (!gift) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <RecipientExperience gift={gift} />
    </div>
  );
}
