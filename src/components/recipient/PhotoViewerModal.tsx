'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar, Camera } from 'lucide-react';
import { MemoryItem } from '@/types/gift';
import { formatDate } from '@/lib/utils';

interface PhotoViewerModalProps {
  isOpen: boolean;
  photos: MemoryItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function PhotoViewerModal({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoViewerModalProps) {
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    const newIdx = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onNavigate(newIdx);
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    const newIdx = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIdx);
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Background scroll locking
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (deltaX > minSwipeDistance) {
      handleNext(); // swiped left -> next
    } else if (deltaX < -minSwipeDistance) {
      handlePrev(); // swiped right -> previous
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="photo-viewer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-10 select-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded photo viewer"
      >
        {/* Top Controls Bar */}
        <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between text-white z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm text-xs font-medium pointer-events-auto">
            <Camera className="w-3.5 h-3.5 text-white/70" />
            <span>
              {currentIndex + 1} / {photos.length}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer pointer-events-auto hover:scale-105 active:scale-95"
            aria-label="Close photo viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous Button (Desktop) */}
        {photos.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden sm:flex absolute left-4 md:left-8 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-90"
            aria-label="Previous photograph"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button (Desktop) */}
        {photos.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden sm:flex absolute right-4 md:right-8 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-90"
            aria-label="Next photograph"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Main Expanded Photograph Card */}
        <motion.div
          key={currentPhoto.id}
          layoutId={`photo-frame-${currentPhoto.id}`}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()} // Clicking photo will NOT close viewer
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative max-w-4xl w-full max-h-[85vh] bg-[var(--theme-surface)] rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col z-10"
        >
          {/* Photograph Container */}
          <div className="relative flex-1 min-h-[260px] max-h-[64vh] flex items-center justify-center bg-black/60 overflow-hidden">
            <img
              src={currentPhoto.image_path}
              alt={currentPhoto.caption || 'Memory photograph'}
              className="max-h-[64vh] w-auto max-w-full object-contain pointer-events-auto"
              loading="eager"
            />
          </div>

          {/* Caption & Date Details Card Bottom */}
          <div className="p-5 sm:p-6 bg-[var(--theme-surface)] border-t border-[var(--theme-border)] text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              {currentPhoto.memory_date && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--theme-secondary)] font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(currentPhoto.memory_date)}</span>
                </div>
              )}
              <p className="font-handwriting text-xl sm:text-2xl text-[var(--theme-text)] leading-snug">
                {currentPhoto.caption || 'A cherished moment.'}
              </p>
            </div>

            {/* Mobile Prev / Next pill buttons */}
            {photos.length > 1 && (
              <div className="flex sm:hidden items-center justify-between pt-2 border-t border-[var(--theme-border)] text-xs text-[var(--theme-muted)]">
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[var(--theme-text)] font-medium inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <span className="text-[11px]">Swipe or tap</span>
                <button
                  onClick={handleNext}
                  className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[var(--theme-text)] font-medium inline-flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
