'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Heart, Sparkles, Check, Gift as GiftIcon, Shield } from 'lucide-react';
import { Gift } from '@/types/gift';

interface PrintKeepsakeViewProps {
  gift: Gift;
  autoPrint?: boolean;
}

export function PrintKeepsakeView({ gift, autoPrint = false }: PrintKeepsakeViewProps) {
  useEffect(() => {
    if (autoPrint) {
      // Allow fonts and images a brief moment to settle before calling print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const recipientName = gift.recipient_name || 'Someone Special';
  const giftTitle = gift.title || 'A Special Keepsake';
  const memories = gift.memories || [];
  const timeline = gift.timeline_entries || [];
  const quiz = gift.quiz_questions || [];
  const letters = gift.letters || [];
  const secrets = gift.secret_messages || [];
  const wishes = gift.wishes || [];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E1B26] antialiased selection:bg-purple-100 selection:text-purple-900 print:bg-white print:text-black">
      {/* Print media stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt;
            line-height: 1.5;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Screen-Only Action Banner */}
      <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/g/${gift.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Gift</span>
            </Link>
            <div className="hidden sm:block">
              <span className="font-serif text-sm font-semibold text-stone-900 block leading-tight">
                Printable Keepsake Memory Book
              </span>
              <span className="text-[11px] text-stone-500">
                Prepared for {recipientName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1625] text-white text-xs font-semibold hover:bg-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-300" />
              <span>Print Keepsake / Save to PDF</span>
            </button>
          </div>
        </div>

        {/* Browser print recommendations pill */}
        <div className="max-w-4xl mx-auto mt-2 text-[11px] text-stone-500 bg-purple-50/70 border border-purple-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>
            <strong>Printing Tip:</strong> In your browser print dialog, select <strong>Save as PDF</strong> and check <strong>&quot;Background graphics&quot;</strong> so all photos, borders, and colors print beautifully.
          </span>
        </div>
      </header>

      {/* Keepsake Document Body */}
      <main className="max-w-3xl mx-auto px-6 py-8 sm:py-12 print:p-0 print:max-w-none">
        
        {/* ========================================================= */}
        {/* PAGE 1: ELEGANT KEEPSAKE COVER PAGE                       */}
        {/* ========================================================= */}
        <section className="page-break-after border-4 border-double border-[#D4AF37]/50 rounded-3xl p-8 sm:p-12 text-center bg-white shadow-xl print:shadow-none print:border-black/30 print:rounded-none relative overflow-hidden mb-12 print:mb-0 min-h-[700px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Dear You Personal Keepsake Edition</span>
            </div>

            <p className="font-handwriting text-3xl sm:text-4xl text-[#B8860B] print:text-black">
              Prepared with love for
            </p>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 print:text-black">
              {recipientName}
            </h1>

            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto my-3 print:bg-black" />

            <h2 className="font-serif text-xl sm:text-2xl font-medium text-stone-700 italic">
              &ldquo;{giftTitle}&rdquo;
            </h2>

            {gift.event_type && (
              <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
                {gift.event_type} {gift.event_date ? `• ${gift.event_date}` : ''}
              </p>
            )}
          </div>

          {/* Cover Photograph (if provided) */}
          {gift.cover_image && (
            <div className="my-6 max-w-md mx-auto w-full rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md print:shadow-none avoid-break">
              <img
                src={gift.cover_image}
                alt={giftTitle}
                className="w-full h-64 object-cover object-center"
              />
            </div>
          )}

          {/* Welcome Message */}
          <div className="space-y-3 max-w-lg mx-auto">
            {gift.welcome_heading && (
              <h3 className="font-serif text-lg font-semibold text-stone-800">
                {gift.welcome_heading}
              </h3>
            )}
            {gift.welcome_message && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                {gift.welcome_message}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-stone-200 text-[10px] text-stone-400 font-mono">
            <span>A cherished memory collection • Kept forever</span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: SURPRISE REVEAL & SECRET MESSAGE              */}
        {/* ========================================================= */}
        {(gift.gift_box_message || gift.scratch_card_hidden_text) && (
          <section className="avoid-break mb-10 p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-sm print:shadow-none print:border-black/20">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
              <GiftIcon className="w-4 h-4 text-purple-600" />
              <h3 className="font-serif text-base font-semibold text-stone-900 uppercase tracking-wide">
                Special Surprise &amp; Secret Reveal
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gift.gift_box_message && (
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 print:bg-stone-50 print:border-stone-300">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 block mb-1">
                    Unwrapped Surprise Note
                  </span>
                  <p className="font-serif text-sm italic text-stone-800 leading-relaxed">
                    &ldquo;{gift.gift_box_message}&rdquo;
                  </p>
                </div>
              )}

              {gift.scratch_card_hidden_text && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 print:bg-stone-50 print:border-stone-300">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 block mb-1">
                    Scratch Card Secret Message
                  </span>
                  <p className="font-serif text-sm font-medium italic text-[#2E1065] print:text-black leading-relaxed">
                    &ldquo;{gift.scratch_card_hidden_text}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: THE MEMORY WALL / PHOTOGRAPH ALBUM             */}
        {/* ========================================================= */}
        {memories.length > 0 && (
          <section className="mb-10">
            <div className="text-center mb-6 avoid-break">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
                Treasured Moments
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                The Memory Wall
              </h3>
              <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {memories.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="avoid-break bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm print:shadow-none print:border-stone-300 flex flex-col justify-between"
                >
                  <div className="rounded-lg overflow-hidden bg-stone-100 aspect-4/3 mb-3 border border-stone-100">
                    <img
                      src={m.image_path}
                      alt={m.caption || `Memory photograph ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    {m.caption && (
                      <p className="font-serif text-xs sm:text-sm text-stone-800 leading-snug">
                        {m.caption}
                      </p>
                    )}
                    {m.memory_date && (
                      <span className="text-[10px] text-stone-500 font-mono mt-1 block">
                        {m.memory_date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: JOURNEY TIMELINE                               */}
        {/* ========================================================= */}
        {timeline.length > 0 && (
          <section className="mb-10 avoid-break">
            <div className="text-center mb-6 avoid-break">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
                Milestones
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                Our Journey Timeline
              </h3>
              <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            <div className="space-y-4 relative border-l-2 border-stone-200 ml-4 pl-5">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="avoid-break relative">
                  <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-200 print:bg-black" />
                  <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs print:shadow-none">
                    <span className="text-[10px] font-mono uppercase text-purple-700 font-semibold print:text-black">
                      {item.event_date}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-stone-900 mt-0.5">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: SHARED TRIVIA QUIZ                             */}
        {/* ========================================================= */}
        {quiz.length > 0 && (
          <section className="mb-10 avoid-break">
            <div className="text-center mb-6 avoid-break">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
                Trivia &amp; Fun
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                How Well Do You Remember?
              </h3>
              <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            <div className="space-y-3">
              {quiz.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="avoid-break p-4 rounded-xl bg-white border border-stone-200 shadow-xs print:shadow-none"
                >
                  <h4 className="font-serif text-xs sm:text-sm font-semibold text-stone-900">
                    {qIdx + 1}. {q.question}
                  </h4>
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center justify-between ${
                          opt.is_correct
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium print:bg-stone-100 print:border-black'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + oIdx)}. {opt.option_text}
                        </span>
                        {opt.is_correct && (
                          <span className="text-[10px] text-emerald-700 font-semibold print:text-black">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 6: HEARTFELT LETTERS                              */}
        {/* ========================================================= */}
        {letters.length > 0 && (
          <section className="mb-10">
            <div className="text-center mb-6 avoid-break">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
                Letters From The Heart
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                Personal Letters
              </h3>
              <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            <div className="space-y-6">
              {letters.map((letter, idx) => (
                <article
                  key={letter.id || idx}
                  className="avoid-break p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-md print:shadow-none print:border-stone-400 relative overflow-hidden"
                >
                  <div className="text-right text-lg text-purple-400 mb-2 font-mono">
                    💌
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
                    {letter.heading}
                  </h4>
                  <div className="font-serif text-xs sm:text-sm text-stone-700 leading-relaxed space-y-3 whitespace-pre-line font-light">
                    {letter.content}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 7: SECRET NOTES & WISHES                          */}
        {/* ========================================================= */}
        {(secrets.length > 0 || wishes.length > 0) && (
          <section className="mb-10 avoid-break">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Secret Notes */}
              {secrets.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs print:shadow-none">
                  <h4 className="font-serif text-sm font-bold text-stone-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Secret Notes Revealed</span>
                  </h4>
                  <div className="space-y-3">
                    {secrets.map((s, sIdx) => (
                      <div
                        key={s.id || sIdx}
                        className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                      >
                        <span className="font-semibold text-stone-900 block mb-0.5">
                          {s.title || `Note #${sIdx + 1}`}
                        </span>
                        <p className="text-stone-700 italic">&ldquo;{s.content}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishes */}
              {wishes.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs print:shadow-none">
                  <h4 className="font-serif text-sm font-bold text-stone-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Wishes For The Future</span>
                  </h4>
                  <div className="space-y-2">
                    {wishes.map((w, wIdx) => (
                      <div
                        key={w.id || wIdx}
                        className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 flex items-start gap-2"
                      >
                        <span className="text-amber-500 shrink-0">✨</span>
                        <span>{w.wish_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* CLOSING SENTIMENT & COLOPHON                              */}
        {/* ========================================================= */}
        <footer className="avoid-break text-center pt-8 border-t-2 border-stone-200 pb-12">
          {gift.closing_message && (
            <div className="max-w-lg mx-auto mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500 block mb-1">
                Closing Parting Words
              </span>
              <p className="font-serif text-sm sm:text-base italic text-stone-800 leading-relaxed">
                &ldquo;{gift.closing_message}&rdquo;
              </p>
            </div>
          )}

          <div className="inline-flex items-center gap-1 text-xs text-purple-800 font-semibold">
            <span>Crafted with love on</span>
            <span className="font-serif font-bold">Dear You</span>
          </div>

          <p className="text-[10px] text-stone-400 mt-2 font-mono">
            Permanent Personal Memory Keepsake • Printed on {new Date().toLocaleDateString()}
          </p>
        </footer>

      </main>
    </div>
  );
}
