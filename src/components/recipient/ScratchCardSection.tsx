'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye, Eraser } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
  hiddenMessage?: string;
}

export function ScratchCardSection({
  hiddenMessage = 'You are more cherished and appreciated than words will ever be able to express. Here is to all the adventures waiting ahead for us!',
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounding rect
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 360;
    canvas.height = rect.height || 180;

    // Fill scratch surface with metallic/gradient silver-gold texture
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#E8E8E8');
    gradient.addColorStop(1, '#A9A9A9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add scratch instruction text on top of canvas
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Scratch here with touch or mouse ✨', canvas.width / 2, canvas.height / 2);
  }, []);

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
    ctx.arc(x, y, 24, 0, Math.PI * 2);
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
      if (transparentPixels / totalSampled > 0.45) {
        handleFullReveal();
      }
    } catch {
      // In case of any cross-origin canvas security issue
    }
  };

  const handleFullReveal = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
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
            Rub away the surface below to reveal a hidden note.
          </p>
        </motion.div>

        {/* Scratch Card Card */}
        <div className="relative rounded-3xl p-6 bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] shadow-xl overflow-hidden flex flex-col items-center">
          {/* Hidden Message Layer (Behind Canvas) */}
          <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800 border border-[var(--theme-border)] p-6 flex flex-col items-center justify-center text-center relative select-none">
            <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
            <p className="font-handwriting text-lg sm:text-xl text-[var(--theme-text)] leading-snug">
              "{hiddenMessage}"
            </p>
          </div>

          {/* Interactive Scratch Canvas */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              className="scratch-canvas absolute inset-6 w-[calc(100%-3rem)] h-44 rounded-2xl shadow-inner z-10"
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

          {/* Accessible Reveal Button */}
          <div className="mt-4 flex items-center justify-between w-full pt-2 text-xs">
            <span className="text-[11px] text-[var(--theme-muted)] flex items-center gap-1">
              <Eraser className="w-3.5 h-3.5" />
              <span>Touch or drag to scratch</span>
            </span>

            {!isRevealed && (
              <button
                onClick={handleFullReveal}
                className="text-[11px] text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
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
