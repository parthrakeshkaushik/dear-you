import React from 'react';
import Link from 'next/link';
import { Gift, ArrowLeft, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions — Dear You',
  description: 'Terms and Conditions governing the use of the Dear You digital gifting platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1625] flex flex-col justify-between p-6">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-8 border-b border-black/5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-platform-violet/15 flex items-center justify-center text-platform-violet shadow-xs">
            <Gift className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Dear You</span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-dark inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <main className="max-w-3xl w-full mx-auto my-12 flex-1 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-platform-violet text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Platform Legal Terms</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-platform-dark font-normal">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-xs text-platform-muted">
            Version 1.0 • Effective Date: November 24, 2026
          </p>
        </div>

        {/* Notice of Placeholder Terms */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Legal Notice / Document Placeholder</strong>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              This document serves as the official placeholder for the Dear You Terms and Conditions. The final comprehensive legal terms will be published prior to public launch. Acceptance of these terms acknowledges your agreement to platform guidelines and respectful usage.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-black/5 shadow-xs space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-dark">
              1. Platform Purpose & Scope
            </h2>
            <p>
              Dear You is a personalized digital gifting platform allowing creators to design, theme, password-protect, and deliver digital greeting experiences to designated recipients.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-dark">
              2. User Accounts & Responsibilities
            </h2>
            <p>
              Creators are responsible for maintaining the confidentiality of their credentials and for all content uploaded or created under their account. You agree not to upload harmful, offensive, infringing, or illegal materials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-dark">
              3. Content Ownership & Respectful Use
            </h2>
            <p>
              You retain all rights to the personal photographs and heartfelt messages you compose. By using the service, you grant Dear You the limited technical license necessary to host, process, and display your gift to your recipient.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-dark">
              4. Developer Inspection & Support
            </h2>
            <p>
              As outlined in our Privacy Policy, our two designated platform developers (<code>kaushikparth363@gmail.com</code> and <code>kaushikparth353@gmail.com</code>) may inspect gift contents, themes, and uploaded media strictly for platform maintenance, troubleshooting, content moderation, and understanding usage patterns to enhance features. All administrative access is audit-logged.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-dark">
              5. Expiry and Termination
            </h2>
            <p>
              Gifts with scheduled expiry dates will automatically transition to closing farewell pages. Creators retain the right to modify, extend, or delete gifts from their dashboard at any time.
            </p>
          </section>
        </div>
      </main>

      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-black/5 text-center text-xs text-platform-muted">
        © {new Date().getFullYear()} Dear You. Thoughtfully designed for meaningful connections.
      </footer>
    </div>
  );
}
