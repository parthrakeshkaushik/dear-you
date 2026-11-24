import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { Eye, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function GiftPreviewPage({ params }: PageProps) {
  const { slug } = params;
  const gift = MOCK_GIFTS[slug];

  if (!gift) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating Admin Preview Banner */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-stone-900/90 text-white text-xs font-medium shadow-xl border border-white/10 backdrop-blur-md">
        <Eye className="w-3.5 h-3.5 text-amber-400" />
        <span>Admin Preview Mode • Unlocked</span>
        <Link
          href="/admin/gifts"
          className="ml-2 pl-2 border-l border-white/20 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit</span>
        </Link>
      </div>

      <RecipientExperience gift={gift} initialUnlocked={true} />
    </div>
  );
}
