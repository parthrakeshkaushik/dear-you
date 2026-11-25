import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DeveloperLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="pb-6 border-b border-white/10 space-y-2">
        <div className="h-4 w-32 bg-white/10 rounded-md" />
        <div className="h-8 w-72 bg-white/10 rounded-xl" />
        <div className="h-3 w-96 bg-white/5 rounded-md" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#0F172A] border border-white/10 p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-4 w-4 bg-white/10 rounded" />
            </div>
            <div className="h-7 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Content Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-[#0F172A] border border-white/10 p-6 space-y-4">
            <div className="h-5 w-36 bg-white/10 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
