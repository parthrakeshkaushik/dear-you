'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface MusicPlayerBarProps {
  audioUrl?: string;
  trackTitle?: string;
}

export function MusicPlayerBar({
  audioUrl = 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  trackTitle = 'Gentle Moments',
}: MusicPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Browser prevented autoplay/play
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!audioUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
      />

      {/* Floating Pill Player at Bottom Left/Right */}
      <div className="fixed bottom-5 right-5 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 rounded-full bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] shadow-xl backdrop-blur-md"
        >
          {/* Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Track Information */}
          <div className="px-2 pr-3 flex items-center gap-2">
            <Music
              className={`w-3.5 h-3.5 text-[var(--theme-primary)] ${
                isPlaying ? 'animate-bounce' : 'opacity-60'
              }`}
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium text-[var(--theme-text)] line-clamp-1 max-w-[120px] sm:max-w-[180px]">
                {trackTitle}
              </span>
              <span className="text-[10px] text-[var(--theme-muted)]">
                {isPlaying ? 'Now Playing' : 'Background Music'}
              </span>
            </div>
          </div>

          {/* Mute Button */}
          {isPlaying && (
            <button
              onClick={toggleMute}
              className="p-2 text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </motion.div>
      </div>
    </>
  );
}
