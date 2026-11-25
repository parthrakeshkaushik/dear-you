'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      window.location.replace('/reset-password' + search + hash);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin" />
    </div>
  );
}
