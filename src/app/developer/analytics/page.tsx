'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Smartphone,
  Laptop,
  Camera,
  Layers,
  Sparkles,
  Users,
  Gift,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MOCK_GIFTS, MOCK_USERS } from '@/lib/mock-data';

export default function DeveloperAnalyticsPage() {
  const [analytics, setAnalytics] = React.useState({
    totalGifts: Object.values(MOCK_GIFTS).length,
    publishedGifts: Object.values(MOCK_GIFTS).filter((g) => g.status === 'published').length,
    draftGifts: Object.values(MOCK_GIFTS).filter((g) => g.status === 'draft').length,
    pausedGifts: 0,
    expiredGifts: 0,
  });

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/developer/analytics');
        if (res.ok) {
          const data = await res.json();
          if (data.analytics) setAnalytics(data.analytics);
        }
      } catch {}
    }
    fetchAnalytics();
  }, []);

  const gifts = Object.values(MOCK_GIFTS);
  const users = MOCK_USERS;

  const totalGifts = analytics.totalGifts;
  const publishedGifts = analytics.publishedGifts;
  const draftGifts = analytics.draftGifts;
  const publishedConversion = Math.round((publishedGifts / Math.max(totalGifts, 1)) * 100);

  const totalPhotos = gifts.reduce((acc, g) => acc + (g.memories?.length || 0), 0);
  const avgPhotosPerGift = (totalPhotos / Math.max(totalGifts, 1)).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          BEHAVIOR & USE CASE INTELLIGENCE
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1.5">
          Platform Analytics & Product Assessment
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Understand how creators design gifts, identify drop-off friction, and assess real-world feature engagement.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10">
          <span className="text-stone-400 text-xs block mb-1 uppercase tracking-wider">
            Publish Conversion
          </span>
          <div className="text-3xl font-bold text-emerald-400">{publishedConversion}%</div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {publishedGifts} of {totalGifts} gifts live
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10">
          <span className="text-stone-400 text-xs block mb-1 uppercase tracking-wider">
            Avg Photos / Gift
          </span>
          <div className="text-3xl font-bold text-purple-400">{avgPhotosPerGift}</div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {totalPhotos} total photos hosted
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10">
          <span className="text-stone-400 text-xs block mb-1 uppercase tracking-wider">
            Avg Sections Active
          </span>
          <div className="text-3xl font-bold text-indigo-400">8.4</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Out of 11 available modules</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10">
          <span className="text-stone-400 text-xs block mb-1 uppercase tracking-wider">
            Mobile Browsing Share
          </span>
          <div className="text-3xl font-bold text-amber-400">74.2%</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Recipient device ratio</span>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Occasions */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
          <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400" />
            <span>Occasion Category Distribution</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs font-mono">
            {[
              { label: 'Birthday Celebrations', count: '58%', bar: 'w-[58%] bg-purple-500' },
              { label: 'Friendship Tributes', count: '22%', bar: 'w-[22%] bg-indigo-500' },
              { label: 'Anniversaries', count: '14%', bar: 'w-[14%] bg-pink-500' },
              { label: 'Appreciation & Gratitude', count: '6%', bar: 'w-[6%] bg-amber-500' },
            ].map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-stone-300">
                  <span>{cat.label}</span>
                  <span className="font-semibold text-white">{cat.count}</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.bar}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Adoption Rates */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
          <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Interactive Feature Adoption</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs font-mono">
            {[
              { name: 'Personal Letter', adoption: '96%', bar: 'w-[96%] bg-indigo-400' },
              { name: 'Virtual Birthday Cake', adoption: '92%', bar: 'w-[92%] bg-purple-400' },
              { name: 'Memory Wall (Hanging Frames)', adoption: '88%', bar: 'w-[88%] bg-pink-400' },
              { name: 'Golden Scratch Card', adoption: '79%', bar: 'w-[79%] bg-amber-400' },
              { name: 'Background Music Player', adoption: '64%', bar: 'w-[64%] bg-teal-400' },
              { name: 'Friendship Quiz', adoption: '48%', bar: 'w-[48%] bg-blue-400' },
            ].map((feat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-stone-300">
                  <span>{feat.name}</span>
                  <span className="font-semibold text-white">{feat.adoption}</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${feat.bar}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Funnel & Drop-off Step Analysis */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4 lg:col-span-2">
          <h3 className="font-serif text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>10-Step Creator Funnel & Retention Analysis</span>
          </h3>
          <p className="text-xs text-stone-400">
            Identifies where creators encounter friction or delay before publishing.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs font-mono">
            {[
              { step: 'Step 1: Basics', complete: '100%', drop: '0% drop' },
              { step: 'Step 2: Theme', complete: '98%', drop: '2% drop' },
              { step: 'Step 3: Intro', complete: '94%', drop: '4% drop' },
              { step: 'Step 4: Letters', complete: '86%', drop: '8% delay (writing time)' },
              { step: 'Step 5: Photos', complete: '82%', drop: '4% drop (uploading)' },
              { step: 'Step 6: Toggles', complete: '80%', drop: '2% drop' },
              { step: 'Step 7: Config', complete: '77%', drop: '3% drop' },
              { step: 'Step 8: Expiry', complete: '75%', drop: '2% drop' },
              { step: 'Step 9: Password', complete: '74%', drop: '1% drop' },
              { step: 'Step 10: Publish', complete: '71%', drop: 'Final publication conversion' },
            ].map((s, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-stone-300 font-semibold block">{s.step}</span>
                <span className="text-lg font-bold text-emerald-400 block">{s.complete}</span>
                <span className="text-[10px] text-stone-500 block">{s.drop}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
