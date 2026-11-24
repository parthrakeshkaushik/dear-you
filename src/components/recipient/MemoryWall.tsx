'use client';

import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { MemoryItem, FrameStyle, FrameSize, MemoryWallConfig } from '@/types/gift';
import { formatDate } from '@/lib/utils';
import { PhotoViewerModal } from './PhotoViewerModal';

interface MemoryWallProps {
  memories?: MemoryItem[];
  wallConfig?: MemoryWallConfig;
}

export type MemoryAnimationState = 'idle' | 'opening' | 'open' | 'closing' | 'returning';

export function MemoryWall({ memories = [], wallConfig }: MemoryWallProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [animationState, setAnimationState] = useState<MemoryAnimationState>('idle');
  const shouldReduceMotion = useReducedMotion();

  // Intentional click handler: only triggers from idle state with no active cooldown
  const handleOpenPhoto = useCallback(
    (index: number) => {
      if (isViewerOpen || isCooldown || activePhotoIndex !== null) return;
      setAnimationState('opening');
      setActivePhotoIndex(index);
      setIsViewerOpen(true);
      requestAnimationFrame(() => {
        setAnimationState('open');
      });
    },
    [isViewerOpen, isCooldown, activePhotoIndex]
  );

  // Intentional close handler: immediately signals viewer to begin exit transition
  const handleClosePhoto = useCallback(() => {
    setIsViewerOpen(false);
    setAnimationState('closing');
  }, []);

  // Clean exit transition completion: resets state to idle and applies post-close cooldown
  const handleExitComplete = useCallback(() => {
    setAnimationState('returning');
    setActivePhotoIndex(null);
    setIsCooldown(true);

    // 400ms cooldown prevents mobile tap residue and cursor hover from triggering repeated animations
    setTimeout(() => {
      setAnimationState('idle');
      setIsCooldown(false);
    }, 400);
  }, []);

  if (!memories || memories.length === 0) return null;

  // Frame size classes
  const getSizeClasses = (size?: FrameSize) => {
    switch (size) {
      case 'small':
        return 'w-[200px] sm:w-[220px]';
      case 'large':
        return 'w-[280px] sm:w-[340px]';
      case 'medium':
      default:
        return 'w-[240px] sm:w-[280px]';
    }
  };

  // Frame style visual treatments
  const getFrameStyling = (style?: FrameStyle) => {
    switch (style) {
      case 'vintage_wood':
        return {
          wrapper: 'bg-[#4A2E18] p-3 sm:p-4 rounded-xl shadow-[0_12px_28px_rgba(40,20,10,0.45)] border-4 border-[#301B0D]',
          photoWrapper: 'rounded-sm shadow-inner border border-amber-900/60 overflow-hidden',
          caption: 'mt-2.5 px-2 py-1 rounded bg-[#301B0D] text-[#E8D3B9] font-serif text-xs text-center border border-amber-800/40',
          pin: 'bg-amber-600 border border-amber-800 shadow-md',
        };
      case 'golden_luxury':
        return {
          wrapper: 'bg-gradient-to-br from-[#E5C158] via-[#D4AF37] to-[#AA820A] p-3 sm:p-4 rounded-xl shadow-[0_16px_36px_rgba(212,175,55,0.35)] border-2 border-yellow-200/60',
          photoWrapper: 'rounded-md shadow-inner border border-yellow-950/20 overflow-hidden',
          caption: 'mt-2.5 px-2 py-1 rounded bg-black/80 text-[#F5E6AB] font-serif text-xs text-center border border-[#D4AF37]/40',
          pin: 'bg-yellow-300 border border-yellow-600 shadow-lg',
        };
      case 'scrapbook':
        return {
          wrapper: 'bg-[#F2ECE1] p-3.5 sm:p-4.5 rounded-sm shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-2 border-[#DCD3C1] relative',
          photoWrapper: 'rounded-xs shadow-xs border border-stone-300 overflow-hidden',
          caption: 'mt-3 font-handwriting text-lg text-stone-800 text-center leading-tight',
          pin: 'bg-rose-400 border border-rose-600 shadow-sm',
          washiTape: true,
        };
      case 'pastel':
        return {
          wrapper: 'bg-gradient-to-br from-pink-100 via-purple-50 to-rose-100 p-3 sm:p-4 rounded-3xl shadow-[0_12px_28px_rgba(244,190,200,0.4)] border-2 border-pink-200/80',
          photoWrapper: 'rounded-2xl shadow-xs overflow-hidden',
          caption: 'mt-2.5 font-handwriting text-base text-purple-900 text-center leading-tight',
          pin: 'bg-pink-400 border border-pink-600 shadow-sm',
        };
      case 'minimal':
        return {
          wrapper: 'bg-white dark:bg-stone-900 p-2.5 sm:p-3 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-black/10 dark:border-white/10',
          photoWrapper: 'rounded-md overflow-hidden',
          caption: 'mt-2 font-sans text-xs text-stone-700 dark:text-stone-300 text-left line-clamp-1',
          pin: 'bg-stone-800 border border-stone-950 shadow-xs',
        };
      case 'theme_custom':
        return {
          wrapper: 'bg-[var(--theme-surface)] p-3 sm:p-4 rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,0.25)] border-2 border-[var(--theme-primary)]/40',
          photoWrapper: 'rounded-xl overflow-hidden border border-[var(--theme-border)]',
          caption: 'mt-2.5 font-handwriting text-lg text-[var(--theme-text)] text-center',
          pin: 'bg-[var(--theme-primary)] border border-white/40 shadow-md',
        };
      case 'polaroid':
      default:
        return {
          wrapper: 'bg-white p-3 pb-6 sm:p-3.5 sm:pb-8 rounded-sm shadow-[0_14px_32px_rgba(0,0,0,0.18)] border border-stone-200/80',
          photoWrapper: 'rounded-none shadow-inner border border-black/5 overflow-hidden',
          caption: 'mt-3 font-handwriting text-lg sm:text-xl text-stone-800 text-center leading-snug px-1',
          pin: 'bg-rose-500 border border-rose-700 shadow-sm',
        };
    }
  };

  return (
    <section className="relative min-h-[85vh] px-4 py-20 overflow-hidden">
      {/* Memory Wall Heading */}
      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="font-handwriting text-2xl sm:text-3xl text-[var(--theme-secondary)] tracking-wide">
            Memories Hanging on Our Wall
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-5xl text-[var(--theme-text)] font-normal">
            The Memory Wall
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[var(--theme-muted)] max-w-md mx-auto leading-relaxed">
            Every photograph is a physical bookmark in the story we share. Tap any frame to explore it closely.
          </p>
        </motion.div>
      </div>

      {/* Wall Display Area */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16 relative z-10 py-6">
        {memories.map((photo, index) => {
          const frameStyle = photo.frame_style || 'polaroid';
          const frameSize = photo.frame_size || 'medium';
          const styling = getFrameStyling(frameStyle);
          const sizeClass = getSizeClasses(frameSize);

          // Calculate natural rotation angle
          const naturalRotation =
            photo.rotation !== undefined && photo.rotation !== null
              ? photo.rotation
              : index % 4 === 0
              ? -3.5
              : index % 4 === 1
              ? 2.5
              : index % 4 === 2
              ? -1.8
              : 3.2;

          // Realistic Hanging swing period based on index for non-synchronized movement
          const swingDuration = 4.5 + (index % 3) * 0.8;

          return (
            <div
              key={photo.id || index}
              className="relative flex flex-col items-center group cursor-pointer"
              onClick={() => handleOpenPhoto(index)}
            >
              {/* Hanging String & Pushpin Anchor */}
              <div className="flex flex-col items-center -mb-2 z-20 pointer-events-none">
                {/* Push Pin */}
                <div
                  className={`w-3.5 h-3.5 rounded-full ${styling.pin} flex items-center justify-center`}
                >
                  <div className="w-1 h-1 rounded-full bg-white/80" />
                </div>
                {/* Twin String hanging lines */}
                <div className="w-8 h-4 flex justify-between px-1">
                  <div className="w-[1px] h-full bg-stone-500/40 rotate-12" />
                  <div className="w-[1px] h-full bg-stone-500/40 -rotate-12" />
                </div>
              </div>

              {/* Framed Photo Container with Physics-Inspired Hanging Swing */}
              <motion.div
                style={{
                  originX: 0.5,
                  originY: 0,
                  rotate: naturalRotation,
                }}
                whileHover={
                  !isViewerOpen && !isCooldown
                    ? {
                        scale: 1.04,
                        rotate: naturalRotation > 0 ? naturalRotation + 1.5 : naturalRotation - 1.5,
                        y: -4,
                        transition: { duration: 0.2 },
                      }
                    : undefined
                }
                animate={
                  !isViewerOpen && !shouldReduceMotion
                    ? {
                        rotate: [
                          naturalRotation,
                          naturalRotation + 0.8,
                          naturalRotation - 0.8,
                          naturalRotation,
                        ],
                      }
                    : { rotate: naturalRotation }
                }
                transition={{
                  repeat: Infinity,
                  duration: swingDuration,
                  ease: 'easeInOut',
                }}
                className={`relative ${sizeClass} ${styling.wrapper} select-none transition-shadow`}
              >
                {/* Washi tape decoration for scrapbook style */}
                {styling.washiTape && (
                  <>
                    <div className="absolute -top-3 left-4 w-12 h-5 bg-amber-200/70 -rotate-6 shadow-xs border-dashed border-amber-300 z-10" />
                    <div className="absolute -top-3 right-4 w-12 h-5 bg-rose-200/70 rotate-6 shadow-xs border-dashed border-rose-300 z-10" />
                  </>
                )}

                {/* Photo Element */}
                <div className={`relative aspect-[4/3] w-full bg-black/15 ${styling.photoWrapper}`}>
                  <img
                    src={photo.image_path}
                    alt={photo.caption || 'Memory photograph'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    loading="lazy"
                  />
                  {/* Subtle hover zoom cue */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5 drop-shadow-md" />
                  </div>
                </div>

                {/* Caption / Note */}
                <div className={styling.caption}>
                  <p>{photo.caption || 'A quiet memory.'}</p>
                  {photo.memory_date && (
                    <span className="block text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                      {formatDate(photo.memory_date)}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Shared Interactive Photo Lightbox Modal with Predictable Lifecycle */}
      <PhotoViewerModal
        isOpen={isViewerOpen && activePhotoIndex !== null}
        photos={memories}
        currentIndex={activePhotoIndex ?? 0}
        onClose={handleClosePhoto}
        onNavigate={(newIdx) => setActivePhotoIndex(newIdx)}
        onExitComplete={handleExitComplete}
      />
    </section>
  );
}
