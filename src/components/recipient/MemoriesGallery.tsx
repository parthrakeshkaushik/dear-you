'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ZoomIn } from 'lucide-react';
import { MemoryItem } from '@/types/gift';
import { formatDate } from '@/lib/utils';
import { PhotoViewerModal } from './PhotoViewerModal';

interface MemoriesGalleryProps {
  memories?: MemoryItem[];
}

export function MemoriesGallery({ memories = [] }: MemoriesGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!memories || memories.length === 0) return null;

  return (
    <section className="min-h-[80vh] px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            Moments frozen in time
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Memories Gallery
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--theme-muted)] max-w-md mx-auto">
            A visual anthology of our favourite laughter, adventures, and milestones.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {memories.map((item, index) => {
            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => setSelectedPhotoIndex(index)}
                className="group cursor-pointer p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-md hover:shadow-xl transition-all"
              >
                {/* Photo container */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/10">
                  <img
                    src={item.image_path}
                    alt={item.caption || 'Memory photograph'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6 drop-shadow-sm" />
                  </div>
                </div>

                {/* Caption & Date */}
                <div className="mt-3.5 px-1">
                  {item.memory_date && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-secondary)] font-medium mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.memory_date)}</span>
                    </div>
                  )}
                  <p className="font-handwriting text-lg text-[var(--theme-text)] line-clamp-2 leading-tight">
                    {item.caption || 'A memorable chapter.'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Shared Interactive Full-Screen Photo Viewer */}
      <PhotoViewerModal
        isOpen={selectedPhotoIndex !== null}
        photos={memories}
        currentIndex={selectedPhotoIndex ?? 0}
        onClose={() => setSelectedPhotoIndex(null)}
        onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
      />
    </section>
  );
}
