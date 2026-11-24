'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  FileArchive,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Heart,
  Laptop,
} from 'lucide-react';
import { Gift } from '@/types/gift';

interface DownloadKeepsakeModalProps {
  gift: Gift;
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadKeepsakeModal({
  gift,
  isOpen,
  onClose,
}: DownloadKeepsakeModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/gifts/${gift.slug}/download?format=zip`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(
          errorData.error ||
            'Could not download this keepsake. The gift may have reached its expiry or requires verification.'
        );
        setIsDownloading(false);
        return;
      }

      // Read binary blob and trigger browser file save
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dear-you-${gift.slug}-keepsake.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 5000);
    } catch {
      setErrorMessage('Network error while generating download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-black/10 relative overflow-hidden text-left"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-platform-violet border border-purple-100 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-platform-violet" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-platform-violet">
                Personal Keepsake
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Save & Keep This Gift
              </h3>
            </div>
          </div>

          <p className="text-xs text-platform-muted leading-relaxed mb-6 font-light">
            Keep a permanent offline copy of this special surprise crafted for{' '}
            <strong className="font-semibold text-platform-dark">{gift.recipient_name}</strong>.
            You can revisit the memories, photos, and heartfelt words anytime—even after the online card closes.
          </p>

          {/* Download Options List */}
          <div className="space-y-3.5">
            {/* Option 1: Standalone Offline ZIP */}
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-platform-violet text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-platform-dark flex items-center gap-1.5">
                    <span>Offline Interactive Package (ZIP)</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-bold">
                      RECOMMENDED
                    </span>
                  </h4>
                  <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
                    Complete standalone website. Unzip & double-click <code className="font-mono text-purple-800">index.html</code> in any browser without internet.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-[#1A1625] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </>
                )}
              </button>
            </div>

            {/* Option 2: Printable PDF */}
            <div className="p-4 rounded-2xl border border-black/10 bg-stone-50/60 hover:bg-stone-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-platform-dark">
                    Printable Keepsake (PDF)
                  </h4>
                  <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
                    Format this gift for clean printing on standard paper or saving as a PDF document.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrintPdf}
                className="px-4 py-2.5 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-platform-dark text-xs font-semibold transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {downloadSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Offline keepsake downloaded! Open <code className="font-mono">index.html</code> to view anytime.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-[11px] text-platform-muted">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-platform-violet" />
              <span>Forever your memory</span>
            </span>
            <span className="font-mono text-[10px]">No login needed</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
