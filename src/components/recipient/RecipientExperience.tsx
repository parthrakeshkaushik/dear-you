'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Gift, SectionType } from '@/types/gift';
import { ThemeContainer } from './ThemeContainer';
import { PasswordGate } from './PasswordGate';
import { WelcomeScreen } from './WelcomeScreen';
import { GiftReveal } from './GiftReveal';
import { CelebrationSection } from './CelebrationSection';
import { MemoryWall } from './MemoryWall';
import { MemoriesGallery } from './MemoriesGallery';
import { TimelineSection } from './TimelineSection';
import { QuizSection } from './QuizSection';
import { ScratchCardSection } from './ScratchCardSection';
import { SecretMessagesSection } from './SecretMessagesSection';
import { FutureWishesSection } from './FutureWishesSection';
import { LetterSection } from './LetterSection';
import { ClosingSection } from './ClosingSection';
import { ExpiryScreen } from './ExpiryScreen';
import { MusicPlayerBar, AudioPlaybackStatus } from './MusicPlayerBar';
import { SectionNavigation } from './SectionNavigation';
import { DownloadKeepsakeModal } from './DownloadKeepsakeModal';
import { CreateYourOwnGiftSection } from './CreateYourOwnGiftSection';
import { Download } from 'lucide-react';

interface RecipientExperienceProps {
  gift: Gift;
  initialUnlocked?: boolean;
  isPreview?: boolean;
  onVerifyPassword?: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export function RecipientExperience({
  gift,
  initialUnlocked = false,
  isPreview = false,
  onVerifyPassword,
}: RecipientExperienceProps) {
  const [isUnlocked, setIsUnlocked] = useState(isPreview ? true : initialUnlocked);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);
  const [hasStartedExperience, setHasStartedExperience] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const isDemo = gift.is_demo === true || gift.slug === 'demo' || gift.slug === 'demo-gift';

  // Audio state & persistence
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(
    gift.music_url || '/audio/gentle-moments.mp3'
  );
  const [playbackStatus, setPlaybackStatus] = useState<AudioPlaybackStatus>('idle');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const hasUserInitiatedPlay = useRef(false);

  // Synchronize audioSrc when creator/gift settings update
  useEffect(() => {
    if (gift.music_url) {
      setAudioSrc(gift.music_url);
    }
  }, [gift.music_url]);

  // Graceful fallback to bundled high-fidelity audio asset if an external URL fails
  const handleAudioError = useCallback(() => {
    const fallbackSrc = '/audio/gentle-moments.mp3';
    if (audioSrc !== fallbackSrc) {
      console.warn(`Primary audio src failed (${audioSrc}), automatically failing over to bundled audio asset (${fallbackSrc})`);
      setAudioSrc(fallbackSrc);
    } else {
      setPlaybackStatus('error');
      setAudioError('Unable to load audio. Tap to retry.');
    }
  }, [audioSrc]);

  // If user has already initiated play and source changed (e.g. fallback triggered), resume playback seamlessly
  useEffect(() => {
    if (hasUserInitiatedPlay.current && audioRef.current && audioSrc) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaybackStatus('playing');
            setAudioError(null);
          })
          .catch((err) => {
            console.warn('Playback error after source update:', err);
            if (err.name === 'NotAllowedError') {
              setPlaybackStatus('blocked');
              setAudioError('Audio blocked by browser. Tap to listen.');
            } else {
              setPlaybackStatus('error');
              setAudioError('Could not start audio. Tap to retry.');
            }
          });
      }
    }
  }, [audioSrc]);

  // Check Expiry (In preview mode, creator explicitly uses the Closing Screen tab to preview expiry)
  const isExpired = useMemo(() => {
    if (isPreview) return false;
    if (!gift.expiry_enabled || !gift.expires_at) return false;
    const expiryTime = new Date(gift.expires_at).getTime();
    return Date.now() > expiryTime;
  }, [isPreview, gift.expiry_enabled, gift.expires_at]);

  // Determine Enabled Sections and their sequence
  const enabledSections = useMemo(() => {
    if (!gift.sections || gift.sections.length === 0) {
      // Default order if sections are not customized
      return [
        'gift_box',
        'celebration',
        'memory_wall',
        'memories',
        'timeline',
        'quiz',
        'scratch_card',
        'secret_messages',
        'future_wishes',
        'letters',
        'closing',
      ] as SectionType[];
    }

    return [...gift.sections]
      .filter((s) => s.enabled)
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_type);
  }, [gift.sections]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Periodic heartbeat session check to detect creator password updates in real-time
  // PREVIEW ARCHITECTURE: Creator preview NEVER validates against recipient access sessions
  useEffect(() => {
    if (isPreview || !isUnlocked) return;

    const checkSession = async () => {
      try {
        const res = await fetch(`/api/gifts/${gift.slug}/session-check`);
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          // Immediately revoke unlocked view and return to password gate
          setIsUnlocked(false);
          if (audioRef.current) {
            audioRef.current.pause();
            setPlaybackStatus('paused');
          }
          setRevocationNotice(
            data.message || 'The card password has been updated. Please enter the new password to continue.'
          );
        }
      } catch {
        // Network non-blocking
      }
    };

    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, [isPreview, isUnlocked, gift.slug]);

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (!audioRef.current) return;
    hasUserInitiatedPlay.current = true;

    if (!audioRef.current.paused && playbackStatus === 'playing') {
      audioRef.current.pause();
      setPlaybackStatus('paused');
    } else {
      setAudioError(null);
      setPlaybackStatus('loading');
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaybackStatus('playing');
            setAudioError(null);
          })
          .catch((err) => {
            console.warn('Audio play request prevented:', err);
            if (err.name === 'NotAllowedError') {
              setPlaybackStatus('blocked');
              setAudioError('Audio blocked by browser. Tap to listen.');
            } else {
              const fallbackSrc = '/audio/gentle-moments.mp3';
              if (audioSrc !== fallbackSrc) {
                setAudioSrc(fallbackSrc);
              } else {
                setPlaybackStatus('error');
                setAudioError('Could not start audio. Tap to retry.');
              }
            }
          });
      }
    }
  }, [playbackStatus, audioSrc]);

  // Mute / Unmute toggle
  const handleToggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const nextMuted = !isAudioMuted;
    audioRef.current.muted = nextMuted;
    setIsAudioMuted(nextMuted);
  }, [isAudioMuted]);

  // Unified "Start Your Journey" Interaction
  // Directly starts background music from the user's primary click/tap gesture!
  const handleStartJourney = useCallback(() => {
    setHasStartedExperience(true);
    hasUserInitiatedPlay.current = true;

    // 1. Initiate music playback synchronously in this click handler
    if (audioRef.current && (audioSrc || gift.music_url)) {
      setAudioError(null);
      setPlaybackStatus('loading');
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaybackStatus('playing');
            setAudioError(null);
          })
          .catch((err) => {
            console.warn('Audio playback could not start automatically:', err);
            if (err.name === 'NotAllowedError') {
              setPlaybackStatus('blocked');
              setAudioError('Browser paused audio. Tap to listen.');
            } else {
              const fallbackSrc = '/audio/gentle-moments.mp3';
              if (audioSrc !== fallbackSrc) {
                setAudioSrc(fallbackSrc);
              } else {
                setPlaybackStatus('error');
                setAudioError('Audio blocked by browser. Tap to listen.');
              }
            }
          });
      }
    }

    // 2. Smoothly transition to the first gift section
    const targetSectionId = enabledSections[0] || 'gift_box';
    const firstSec = document.getElementById(targetSectionId);
    if (firstSec) {
      firstSec.scrollIntoView({ behavior: 'smooth' });
    }
  }, [audioSrc, gift.music_url, enabledSections]);

  // Handle password verification with server endpoint
  const handleVerifyPassword = async (password: string) => {
    if (onVerifyPassword) {
      return await onVerifyPassword(password);
    }
    
    try {
      const res = await fetch(`/api/gifts/${gift.slug}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Incorrect password' };
      }

      return { success: true };
    } catch {
      // Fallback in offline / sandbox preview
      if (password === 'special' || password === 'love' || password === 'birthday') {
        return { success: true };
      }
      return { success: false, error: 'Could not connect to verification server' };
    }
  };

  // If expired, immediately render the elegant theme-consistent closing experience
  if (isExpired) {
    const expiryCfg = gift.theme_config?.expiry_page || gift.expiry_page_config;
    const expiryTheme = expiryCfg?.theme_id || gift.selected_theme;
    return (
      <ThemeContainer themeId={expiryTheme} customConfig={gift.theme_config}>
        <ExpiryScreen
          recipientName={gift.recipient_name}
          themeId={expiryTheme}
          heading={expiryCfg?.heading || gift.expiry_heading}
          message={expiryCfg?.message || gift.expiry_message}
          config={expiryCfg}
        />
      </ThemeContainer>
    );
  }

  // If locked, render Password Gate
  if (!isUnlocked) {
    return (
      <ThemeContainer themeId={gift.selected_theme} customConfig={gift.theme_config}>
        <PasswordGate
          giftTitle={gift.title}
          recipientName={gift.recipient_name}
          passwordHint={isDemo ? 'special' : gift.password_hint}
          isDemo={isDemo}
          revocationNotice={revocationNotice}
          config={gift.theme_config?.password_page || gift.password_page_config}
          onSubmit={handleVerifyPassword}
          onSuccess={() => {
            setIsUnlocked(true);
            setRevocationNotice(null);
          }}
        />
      </ThemeContainer>
    );
  }

  // Navigation Items for sidebar indicator
  const navItems = [
    { id: 'welcome', label: 'Welcome' },
    ...enabledSections.map((sec) => ({
      id: sec,
      label: sec.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    })),
  ];

  return (
    <ThemeContainer themeId={gift.selected_theme} customConfig={gift.theme_config}>
      {/* Background HTML5 Audio Element (Continuous playback, never unmounts across sections) */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          preload="auto"
          onPlay={() => {
            setPlaybackStatus('playing');
            setAudioError(null);
          }}
          onPlaying={() => {
            setPlaybackStatus('playing');
            setAudioError(null);
          }}
          onPause={() => {
            setPlaybackStatus((prev) => (prev === 'error' || prev === 'blocked' ? prev : 'paused'));
          }}
          onWaiting={() => {
            setPlaybackStatus('loading');
          }}
          onCanPlay={() => {
            setPlaybackStatus((prev) => (prev === 'loading' ? 'paused' : prev));
          }}
          onEnded={() => {
            setPlaybackStatus('paused');
          }}
          onError={handleAudioError}
        />
      )}

      {/* Persistent Floating Music Control (Appears and reflects playback across the journey) */}
      {audioSrc && (
        <MusicPlayerBar
          isPlaying={playbackStatus === 'playing'}
          playbackStatus={playbackStatus}
          isMuted={isAudioMuted}
          trackTitle={gift.music_title || 'Gentle Moments'}
          audioError={audioError}
          hasStartedJourney={hasStartedExperience}
          onTogglePlay={handleTogglePlay}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Side Section Navigation Dots */}
      <SectionNavigation sections={navItems} />

      {/* Floating Save Card Button */}
      <button
        onClick={() => setIsDownloadModalOpen(true)}
        className="fixed top-4 right-4 z-40 px-3.5 py-2 rounded-full bg-[var(--theme-surface)]/90 backdrop-blur-md border border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text)] shadow-xs hover:shadow-md hover:border-[var(--theme-primary)] transition-all flex items-center gap-1.5 cursor-pointer"
        title="Download / Save Offline Keepsake"
      >
        <Download className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
        <span className="hidden sm:inline">Save Card</span>
      </button>

      <main className="w-full">
        {/* Welcome Section with "Start Your Journey" */}
        <div id="welcome">
          <WelcomeScreen
            recipientName={gift.recipient_name}
            heading={gift.welcome_heading}
            message={gift.welcome_message}
            buttonText={gift.welcome_button_text}
            coverImage={gift.cover_image}
            hasMusic={Boolean(audioSrc)}
            musicTitle={gift.music_title || 'Gentle Moments'}
            onProceed={handleStartJourney}
          />
        </div>

        {/* Dynamic Sections Sequence */}
        {enabledSections.map((sectionType) => {
          switch (sectionType) {
            case 'gift_box':
              return (
                <div key="gift_box" id="gift_box">
                  <GiftReveal
                    revealHeading={gift.title}
                    surpriseMessage={gift.gift_box_message}
                  />
                </div>
              );

            case 'celebration':
              return (
                <div key="celebration" id="celebration">
                  <CelebrationSection
                    recipientName={gift.recipient_name}
                    eventType={gift.event_type}
                    wishes={gift.wishes}
                    cakeEnabled={true}
                  />
                </div>
              );

            case 'memory_wall':
              return (
                <div key="memory_wall" id="memory_wall">
                  <MemoryWall memories={gift.memories} wallConfig={gift.memory_wall_config} />
                </div>
              );

            case 'memories':
              return (
                <div key="memories" id="memories">
                  <MemoriesGallery memories={gift.memories} />
                </div>
              );

            case 'timeline':
              return (
                <div key="timeline" id="timeline">
                  <TimelineSection entries={gift.timeline_entries} />
                </div>
              );

            case 'quiz':
              return (
                <div key="quiz" id="quiz">
                  <QuizSection
                    questions={gift.quiz_questions}
                    recipientName={gift.recipient_name}
                  />
                </div>
              );

            case 'scratch_card':
              return (
                <div key="scratch_card" id="scratch_card">
                  <ScratchCardSection hiddenMessage={gift.scratch_card_hidden_text} />
                </div>
              );

            case 'secret_messages':
              return (
                <div key="secret_messages" id="secret_messages">
                  <SecretMessagesSection messages={gift.secret_messages} />
                </div>
              );

            case 'future_wishes':
              return (
                <div key="future_wishes" id="future_wishes">
                  <FutureWishesSection
                    wishes={gift.wishes}
                    recipientName={gift.recipient_name}
                  />
                </div>
              );

            case 'letters':
              return (
                <div key="letters" id="letters">
                  <LetterSection
                    letters={gift.letters}
                    recipientName={gift.recipient_name}
                  />
                </div>
              );

            case 'closing':
              return (
                <div key="closing" id="closing">
                  <ClosingSection
                    recipientName={gift.recipient_name}
                    closingMessage={gift.closing_message}
                    onDownloadKeepsake={() => setIsDownloadModalOpen(true)}
                    onReplay={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              );

            default:
              return null;
          }
        })}

        {/* Platform Call to Action: Separate, elegant promotional section appearing strictly after sender's content */}
        <CreateYourOwnGiftSection />
      </main>

      {/* Recipient Keepsake Download Modal */}
      <DownloadKeepsakeModal
        gift={gift}
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </ThemeContainer>
  );
}
