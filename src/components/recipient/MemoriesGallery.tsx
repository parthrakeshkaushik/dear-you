'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Calendar, X, ZoomIn } from 'lucide-react';
import { MemoryItem } from '@/types/gift';
import { formatDate } from '@/lib/utils';

interface MemoriesGalleryProps {
  memories?: MemoryItem[];
}

export function MemoriesGallery({ memories = [] }: MemoriesGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<MemoryItem | null>(null);

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
            // Subtle alternating tilt for organic scrapbook feel
            const tilt = index % 3 === 0 ? '-rotate-1' : index % 3 === 1 ? 'rotate-1' : 'rotate-0';

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => setSelectedImage(item)}
                className={`group cursor-pointer p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-md hover:shadow-xl transition-all ${tilt}`}
              >
                {/* Photo container */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/10">
                  <img
                    src={item.image_path || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'}
                    alt={item.caption || 'Memory photograph'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6" />
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[var(--theme-surface)] rounded-2xl overflow-hidden border border-[var(--theme-border)] shadow-2xl flex flex-col"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative max-h-[70vh] flex items-center justify-center bg-black/40">
                <img
                  src={selectedImage.image_path}
                  alt={selectedImage.caption}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>

              <div className="p-5 sm:p-6 bg-[var(--theme-surface)]">
                {selectedImage.memory_date && (
                  <p className="text-xs text-[var(--theme-secondary)] mb-1 font-medium">
                    {formatDate(selectedImage.memory_date)}
                  </p>
                )}
                <p className="font-handwriting text-xl sm:text-2xl text-[var(--theme-text)]">
                  {selectedImage.caption}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
