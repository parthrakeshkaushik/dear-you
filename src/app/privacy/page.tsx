import React from 'react';
import Link from 'next/link';
import { Gift, ArrowLeft, Shield, Eye, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Dear You',
  description: 'Detailed privacy policy and data governance practices for the Dear You digital gifting platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-platform-bg text-platform-text flex flex-col justify-between p-6 transition-colors duration-200">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-8 border-b border-platform-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/brand/logo.png"
            alt="Dear You"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-xl font-semibold tracking-tight text-platform-text">Dear You</span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-platform-muted hover:text-platform-text inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <main className="max-w-3xl w-full mx-auto my-12 flex-1 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-platform-violet text-xs font-semibold mb-3 border border-purple-100 dark:border-purple-800/40">
            <Shield className="w-3.5 h-3.5" />
            <span>Data Transparency & Privacy</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-platform-text font-normal">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-platform-muted">
            Version 1.0 • Last Updated: November 24, 2026
          </p>
        </div>

        {/* Core Transparent Disclosure Card */}
        <div className="p-5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-300">
            <Eye className="w-4 h-4 text-platform-violet" />
            <span>Developer Content Inspection Disclosure</span>
          </div>
          <p className="text-purple-900/85 dark:text-purple-200/85 leading-relaxed">
            We believe in complete transparency. To maintain system reliability, support creators, ensure safety, and improve Dear You through actual use cases, our <strong>two authorized platform developers</strong> have restricted, audit-logged administrative access to inspect gift titles, recipient names, written messages, letters, and uploaded photographs. All inspections are strictly logged and monitored.
          </p>
        </div>

        <div className="bg-platform-card p-8 sm:p-10 rounded-3xl border border-platform-border shadow-xs space-y-7 text-xs sm:text-sm text-platform-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-text">
              1. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-platform-muted">
              <li><strong className="text-platform-text">Account Credentials:</strong> Email address, password (stored as a secure salted Bcrypt hash), and display name.</li>
              <li><strong className="text-platform-text">Gift Content:</strong> Gift titles, recipient names, welcome messages, letters, wishes, trivia questions, timeline milestones, and secret notes.</li>
              <li><strong className="text-platform-text">Photographs & Media:</strong> Images uploaded for the Memory Wall, photo galleries, cover images, and timeline photos.</li>
              <li><strong className="text-platform-text">Usage Analytics:</strong> Theme selections, enabled feature preferences, and aggregated interaction events.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-text">
              2. Authorized Developer Inspection
            </h2>
            <p>
              To ensure platform quality and guide real-world feature development, authorized developers may inspect gift contents under the following principles:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-platform-muted">
              <li><strong className="text-platform-text">Who can inspect:</strong> Exactly two authorized platform developers (`kaushikparth363@gmail.com` and `kaushikparth353@gmail.com`) with multi-factor secured developer accounts.</li>
              <li><strong className="text-platform-text">Why we inspect:</strong> For platform administration, system reliability, creator troubleshooting, content moderation, and studying real creator use cases to enhance responsive layouts and memory experiences.</li>
              <li><strong className="text-platform-text">Audit Logging:</strong> Every inspection action (viewing a user profile, opening gift messages, or loading media) is recorded with an immutable audit log timestamp in our Developer Audit Registry.</li>
              <li><strong className="text-platform-text">Media Privacy:</strong> Private photographs and memory media are protected through secure server-side authorization and are never indexed, publicly accessible, or browsable outside authorized sessions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-text">
              3. Recipient Access & Password Protection
            </h2>
            <p>
              Public visitors cannot view your gift without knowing the unique URL and the specific password you configure. Recipient passwords are never displayed in developer inspection consoles and are securely hashed on the server.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-text">
              4. Data Retention and Deletion
            </h2>
            <p>
              Your content remains stored until you delete the gift from your Creator Dashboard or request an account deletion. Expired gifts retain their custom closing messages while their sensitive media and personal letters are hidden from public view.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-semibold text-platform-text">
              5. Contact Us Regarding Privacy
            </h2>
            <p>
              If you have any questions or wish to submit a data deletion request, you can contact the Dear You developer team directly at:
            </p>
            <p className="font-mono text-xs text-platform-violet bg-platform-cardSubtle border border-platform-border p-2.5 rounded-lg inline-block">
              kaushikparth363@gmail.com / kaushikparth353@gmail.com
            </p>
          </section>
        </div>
      </main>

      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-platform-border text-center text-xs text-platform-muted">
        © {new Date().getFullYear()} Dear You.
      </footer>
    </div>
  );
}
