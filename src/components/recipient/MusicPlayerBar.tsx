'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Music, AlertCircle, Loader2 } from 'lucide-react';

export type AudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error';

interface MusicPlayerBarProps {
  isPlaying: boolean;
  isMuted: boolean;
  trackTitle?: string;
  playbackStatus?: AudioPlaybackStatus;
  audioError?: string | null;
  hasStartedJourney?: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}

export function MusicPlayerBar({
  isPlaying,
  isMuted,
  trackTitle = 'Gentle Moments',
  playbackStatus = 'idle',
  audioError,
  hasStartedJourney = true,
  onTogglePlay,
  onToggleMute,
}: MusicPlayerBarProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const buttonLabel = isPlaying
    ? 'Pause Music'
    : hasStartedJourney
    ? 'Continue Music'
    : 'Play Music';

  const statusLabel = isPlaying
    ? 'Now Playing'
    : playbackStatus === 'loading'
    ? 'Loading...'
    : playbackStatus === 'blocked'
    ? 'Tap to play'
    : hasStartedJourney
    ? 'Continue Music'
    : 'Paused';

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none">
      <AnimatePresence>
        {/* Subtle Browser Blocked / Retry Prompt Banner */}
        {(audioError || playbackStatus === 'blocked') && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onClick={onTogglePlay}
            className="mb-2 px-3.5 py-2 rounded-full bg-[var(--theme-surface)]/95 border border-[var(--theme-border)] shadow-lg backdrop-blur-md text-[var(--theme-text)] text-xs flex items-center gap-2 cursor-pointer hover:border-[var(--theme-primary)] transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">
              {playbackStatus === 'blocked' ? 'Tap to continue music 🎵' : (audioError || 'Tap to play music 🎵')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] shadow-xl backdrop-blur-md"
      >
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          aria-label={buttonLabel}
          title={buttonLabel}
        >
          {playbackStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Minimized toggle view or full info */}
        {!isMinimized ? (
          <>
            {/* Equalizer Soundwave Animation */}
            <div className="flex items-center gap-0.5 px-1 h-5">
              {[0.4, 0.8, 0.5, 0.9].map((multiplier, i) => (
                <motion.span
                  key={i}
                  animate={
                    isPlaying
                      ? {
                          height: ['4px', `${14 * multiplier}px`, '6px', `${18 * multiplier}px`, '4px'],
                        }
                      : { height: '4px' }
                  }
                  transition={
                    isPlaying
                      ? {
                          repeat: Infinity,
                          duration: 1.1 + i * 0.15,
                          ease: 'easeInOut',
                        }
                      : { duration: 0.2 }
                  }
                  className="w-0.5 bg-[var(--theme-primary)] rounded-full shrink-0"
                />
              ))}
            </div>

            {/* Track Info */}
            <div className="px-1.5 pr-2 flex flex-col text-left">
              <span className="text-xs font-medium text-[var(--theme-text)] line-clamp-1 max-w-[110px] sm:max-w-[170px]">
                {trackTitle}
              </span>
              <span className="text-[10px] text-[var(--theme-muted)]">
                {statusLabel}
              </span>
            </div>

            {/* Mute/Unmute Button */}
            <button
              onClick={onToggleMute}
              className="p-1.5 text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors cursor-pointer rounded-full"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </>
        ) : null}

        {/* Small Expand/Collapse Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-[var(--theme-muted)] hover:text-[var(--theme-text)] text-[10px] transition-colors rounded-full px-1.5"
          title={isMinimized ? 'Expand music player' : 'Minimize player'}
        >
          {isMinimized ? <Music className="w-3.5 h-3.5" /> : '•'}
        </button>
      </motion.div>
    </div>
  );
}
