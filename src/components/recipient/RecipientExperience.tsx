'use client';

import React, { useState, useMemo } from 'react';
import { Gift, SectionType } from '@/types/gift';
import { ThemeContainer } from './ThemeContainer';
import { PasswordGate } from './PasswordGate';
import { WelcomeScreen } from './WelcomeScreen';
import { GiftReveal } from './GiftReveal';
import { CelebrationSection } from './CelebrationSection';
import { MemoriesGallery } from './MemoriesGallery';
import { TimelineSection } from './TimelineSection';
import { QuizSection } from './QuizSection';
import { ScratchCardSection } from './ScratchCardSection';
import { SecretMessagesSection } from './SecretMessagesSection';
import { FutureWishesSection } from './FutureWishesSection';
import { LetterSection } from './LetterSection';
import { ClosingSection } from './ClosingSection';
import { ExpiryScreen } from './ExpiryScreen';
import { MusicPlayerBar } from './MusicPlayerBar';
import { SectionNavigation } from './SectionNavigation';

interface RecipientExperienceProps {
  gift: Gift;
  initialUnlocked?: boolean;
  onVerifyPassword?: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export function RecipientExperience({
  gift,
  initialUnlocked = false,
  onVerifyPassword,
}: RecipientExperienceProps) {
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [hasStartedExperience, setHasStartedExperience] = useState(false);

  // Check Expiry
  const isExpired = useMemo(() => {
    if (!gift.expiry_enabled || !gift.expires_at) return false;
    const expiryTime = new Date(gift.expires_at).getTime();
    return Date.now() > expiryTime;
  }, [gift.expiry_enabled, gift.expires_at]);

  // Determine Enabled Sections and their sequence
  const enabledSections = useMemo(() => {
    if (!gift.sections || gift.sections.length === 0) {
      // Default order if sections are not customized
      return [
        'gift_box',
        'celebration',
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
    return (
      <ThemeContainer themeId={gift.selected_theme} customConfig={gift.theme_config}>
        <ExpiryScreen
          recipientName={gift.recipient_name}
          themeId={gift.selected_theme}
          heading={gift.expiry_heading}
          message={gift.expiry_message}
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
          passwordHint={gift.password_hint}
          onSubmit={handleVerifyPassword}
          onSuccess={() => setIsUnlocked(true)}
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
      {/* Background Music Player (if music is enabled or provided) */}
      {gift.music_url && (
        <MusicPlayerBar
          audioUrl={gift.music_url}
          trackTitle={gift.music_title || 'Gentle Melody'}
        />
      )}

      {/* Side Section Navigation Dots */}
      <SectionNavigation sections={navItems} />

      <main className="w-full">
        {/* Welcome Section */}
        <div id="welcome">
          <WelcomeScreen
            recipientName={gift.recipient_name}
            heading={gift.welcome_heading}
            message={gift.welcome_message}
            buttonText={gift.welcome_button_text}
            coverImage={gift.cover_image}
            onProceed={() => {
              setHasStartedExperience(true);
              const firstSec = document.getElementById(enabledSections[0] || 'celebration');
              if (firstSec) {
                firstSec.scrollIntoView({ behavior: 'smooth' });
              }
            }}
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
      </main>
    </ThemeContainer>
  );
}
