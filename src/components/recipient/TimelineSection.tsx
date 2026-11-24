'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import { TimelineEntry } from '@/types/gift';
import { formatDate } from '@/lib/utils';

interface TimelineSectionProps {
  entries?: TimelineEntry[];
}

export function TimelineSection({ entries = [] }: TimelineSectionProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <section className="min-h-[80vh] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            How our story unfolded
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Memory Timeline
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] max-w-md mx-auto">
            Stepping through the days and seasons that shaped us.
          </p>
        </motion.div>

        {/* Timeline Track */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-[var(--theme-border)] space-y-10 ml-4 sm:ml-8">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id || index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Dot Marker on Timeline Line */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[var(--theme-bg)] border-2 border-[var(--theme-primary)] flex items-center justify-center group-hover:scale-125 transition-transform">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
              </div>

              {/* Entry Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-secondary)] mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(entry.event_date)}</span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-medium text-[var(--theme-text)]">
                  {entry.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] font-light leading-relaxed">
                  {entry.description}
                </p>

                {entry.image_path && (
                  <div className="mt-4 rounded-xl overflow-hidden max-h-56 bg-black/10">
                    <img
                      src={entry.image_path}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
