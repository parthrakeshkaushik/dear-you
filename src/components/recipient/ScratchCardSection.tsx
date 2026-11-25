'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye, Eraser } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeId, CustomThemeConfig } from '@/types/theme';
import { getScratchCardPalette } from '@/lib/theme/scratch-card-theme';

interface ScratchCardProps {
  hiddenMessage?: string;
  themeId?: ThemeId;
  themeConfig?: CustomThemeConfig;
  giftId?: string;
  slug?: string;
  isPreview?: boolean;
}

export function ScratchCardSection({
  hiddenMessage = 'You are more cherished and appreciated than words will ever be able to express. Here is to all the adventures waiting ahead for us!',
  themeId = 'dreamy',
  themeConfig,
  giftId,
  slug,
  isPreview = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storageKey = slug || giftId ? `dy_scratch_revealed_${slug || giftId}` : null;
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);

  // Restore revealed state if user refreshes the page
  useEffect(() => {
    if (!isPreview && storageKey && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved === 'true') {
          setIsRevealed(true);
        }
      } catch {
        // Ignore session storage errors
      }
    }
  }, [storageKey, isPreview]);

  // Compute dynamic theme-aware contrast palette
  const palette = useMemo(
    () => getScratchCardPalette({ themeId, themeConfig }),
    [themeId, themeConfig]
  );

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounding rect
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 360;
    canvas.height = rect.height || 192;

    // Fill scratch surface with metallic silver-gold texture
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.2, '#E8E8E8');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(0.8, '#F5E6AB');
    gradient.addColorStop(1, '#A9A9A9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add high-contrast scratch instruction text on top of canvas
    ctx.fillStyle = '#261938';
    ctx.font = '600 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Rub with touch or mouse to reveal ✨', canvas.width / 2, canvas.height / 2);
  }, []);

  useEffect(() => {
    if (!isRevealed) {
      initCanvas();
    }
  }, [isRevealed, initCanvas]);

  const scratch = (clientX: number, clientY: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch completion periodically
    checkScratchedPercentage(ctx, canvas.width, canvas.height);
  };

  const checkScratchedPercentage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      for (let i = 3; i < pixels.length; i += 32) {
        if (pixels[i] === 0) {
          transparentPixels++;
        }
      }
      const totalSampled = pixels.length / 32;
      if (transparentPixels / totalSampled > 0.42) {
        handleFullReveal();
      }
    } catch {
      // In case of any cross-origin canvas security issue
    }
  };

  const handleFullReveal = () => {
    if (isRevealed) return;
    setIsRevealed(true);

    if (!isPreview && storageKey && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch {
        // Ignore session storage errors
      }
    }

    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore
    }
  };

  return (
    <section className="min-h-[70vh] px-4 py-16 flex flex-col items-center justify-center">
      <div className="max-w-md mx-auto w-full text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            A playful mystery
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Golden Scratch Card
          </h2>
          <p className="mt-2 text-xs text-[var(--theme-muted)]">
            Rub away the foil surface below to uncover a special secret note.
          </p>
        </motion.div>

        {/* Scratch Card Outer Container */}
        <div className="relative rounded-3xl p-6 bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] shadow-xl overflow-hidden flex flex-col items-center">
          {/* Scratch Area Wrapper */}
          <div className="relative w-full min-h-[12rem] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {/* Hidden Message Layer (Behind Canvas, visible through scratch and on full reveal) */}
            <div
              className="w-full h-full min-h-[12rem] rounded-2xl p-6 flex flex-col items-center justify-center text-center select-none"
              style={{
                background: palette.revealBg,
                borderColor: palette.revealBorder,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: palette.textColor,
              }}
            >
              <Sparkles
                className="w-5 h-5 mb-2.5 transition-transform duration-300 shrink-0"
                style={{ color: palette.iconColor }}
              />
              <p
                className="font-handwriting text-xl sm:text-2xl leading-relaxed font-semibold max-w-sm mx-auto"
                style={{ color: palette.textColor }}
              >
                &ldquo;{hiddenMessage}&rdquo;
              </p>
            </div>

            {/* Interactive Scratch Canvas */}
            {!isRevealed && (
              <canvas
                ref={canvasRef}
                className="scratch-canvas absolute inset-0 w-full h-full rounded-2xl shadow-inner z-10 cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={() => setIsScratching(true)}
                onMouseUp={() => setIsScratching(false)}
                onMouseLeave={() => setIsScratching(false)}
                onMouseMove={(e) => {
                  if (isScratching) scratch(e.clientX, e.clientY);
                }}
                onTouchStart={() => setIsScratching(true)}
                onTouchEnd={() => setIsScratching(false)}
                onTouchMove={(e) => {
                  if (e.touches[0]) {
                    scratch(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
              />
            )}
          </div>

          {/* Accessible Control Bar */}
          <div className="mt-4 flex items-center justify-between w-full pt-2 text-xs">
            <span
              className="text-[11px] flex items-center gap-1.5 font-medium"
              style={{ color: 'var(--theme-muted)' }}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>{isRevealed ? 'Secret message revealed ✨' : 'Touch or drag to scratch'}</span>
            </span>

            {!isRevealed && (
              <button
                type="button"
                onClick={handleFullReveal}
                className="text-[11px] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                style={{ color: 'var(--theme-primary)' }}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Instant Reveal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
