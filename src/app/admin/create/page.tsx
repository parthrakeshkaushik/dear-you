'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  Check,
  Palette,
  FileText,
  Image as ImageIcon,
  Sliders,
  Settings2,
  Calendar,
  Lock,
  Eye,
  Sparkles,
  Plus,
  Trash2,
  Music,
  Cake,
  HelpCircle,
  Clock,
  Laptop,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { ThemeId, CustomThemeConfig } from '@/types/theme';
import { EventType, SectionType, MemoryItem, TimelineEntry, QuizQuestion, SecretMessage, GiftWish, GiftLetter } from '@/types/gift';
import { THEME_PRESETS, getThemeDefinition } from '@/config/themes';
import { RecipientExperience } from '@/components/recipient/RecipientExperience';
import { Gift as GiftType } from '@/types/gift';

export default function GiftBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Form State
  const [recipientName, setRecipientName] = useState('Ananya');
  const [title, setTitle] = useState('A Celestial Surprise for Ananya');
  const [eventType, setEventType] = useState<EventType>('Birthday');
  const [eventDate, setEventDate] = useState('2026-11-25');
  const [slug, setSlug] = useState('ananya-birthday');
  const [introduction, setIntroduction] = useState('A little universe crafted just for you.');
  const [coverImage, setCoverImage] = useState('');

  // Step 2: Theme State
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('dreamy');
  const [customTheme, setCustomTheme] = useState<CustomThemeConfig>({
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    backgroundColor: '#0F172A',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    accentColor: '#F59E0B',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    animationIntensity: 'gentle',
    backgroundStyle: 'stars',
  });

  // Step 3: Welcome Screen
  const [welcomeHeading, setWelcomeHeading] = useState('A starry sanctuary, crafted with love.');
  const [welcomeMessage, setWelcomeMessage] = useState('Take a breath, relax, and step into this moment prepared for you.');
  const [welcomeButtonText, setWelcomeButtonText] = useState('Open Your Surprise');

  // Step 4: Personal Content
  const [giftBoxMessage, setGiftBoxMessage] = useState('May this year bring gentle days, deep laughter, and wishes fulfilled.');
  const [scratchCardHiddenText, setScratchCardHiddenText] = useState('You make every room brighter simply by walking into it.');
  const [closingMessage, setClosingMessage] = useState('No matter where life leads, know that you are loved and cherished.');

  // Step 5: Media
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'm1',
      image_path: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
      caption: 'The rooftop coffee where we talked until the city lights came on.',
      memory_date: '2024-03-14',
      display_order: 1,
    },
    {
      id: 'm2',
      image_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      caption: 'Unforgettable monsoon road trip in the misty hills.',
      memory_date: '2024-07-22',
      display_order: 2,
    },
  ]);

  // Step 6: Feature Toggles
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    gift_box: true,
    celebration: true,
    memories: true,
    timeline: true,
    quiz: true,
    scratch_card: true,
    secret_messages: true,
    future_wishes: true,
    letters: true,
    music: true,
    closing: true,
  });

  // Step 7: Feature Config (Timeline, Quiz, Secrets, Letter)
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([
    {
      id: 't1',
      title: 'The First Hello',
      description: 'Orientation hall where we ended up sharing notes and laughing together.',
      event_date: '2023-09-15',
      display_order: 1,
    },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: 'Where did we eat our very first meal together?',
      display_order: 1,
      options: [
        { id: 'o1', option_text: 'Corner Bakery & Chai', is_correct: true, display_order: 1 },
        { id: 'o2', option_text: 'Subway Station Cafe', is_correct: false, display_order: 2 },
      ],
    },
  ]);

  const [secretMessages, setSecretMessages] = useState<SecretMessage[]>([
    {
      id: 's1',
      title: 'Secret Appreciation',
      content: 'Your quiet kindness inspires everyone around you more than you know.',
      reveal_type: 'tap',
      display_order: 1,
    },
  ]);

  const [letters, setLetters] = useState<GiftLetter[]>([
    {
      id: 'l1',
      heading: 'To the one who brings joy everywhere',
      content: 'Looking back over all our memories, I am endlessly grateful for your friendship. May this special milestone be everything you hoped for and more.',
      display_order: 1,
    },
  ]);

  const [wishes, setWishes] = useState<GiftWish[]>([
    { id: 'w1', wish_text: 'Peace of mind and restful nights.', display_order: 1 },
    { id: 'w2', wish_text: 'Adventures that make your heart race with joy.', display_order: 2 },
  ]);

  // Step 8: Expiry
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [expiryTime, setExpiryTime] = useState('23:59');
  const [expiryTimezone, setExpiryTimezone] = useState('Asia/Kolkata');
  const [expiryHeading, setExpiryHeading] = useState('This little surprise has reached its final page.');
  const [expiryMessage, setExpiryMessage] = useState('Although this gift is no longer active, the memories and wishes behind it will always remain special.');

  // Step 9: Password
  const [password, setPassword] = useState('special');
  const [passwordHint, setPasswordHint] = useState('Our favorite word for magical moments');

  // Step 10: Preview Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);

  // Construct preview Gift object
  const previewGift: GiftType = {
    id: 'builder-preview',
    recipient_name: recipientName,
    title,
    slug,
    event_type: eventType,
    event_date: eventDate,
    selected_theme: selectedTheme,
    theme_config: selectedTheme === 'custom' ? customTheme : undefined,
    status: 'draft',
    introduction,
    welcome_heading: welcomeHeading,
    welcome_message: welcomeMessage,
    welcome_button_text: welcomeButtonText,
    gift_box_message: giftBoxMessage,
    scratch_card_hidden_text: scratchCardHiddenText,
    closing_message: closingMessage,
    password_hint: passwordHint,
    expiry_enabled: expiryEnabled,
    expires_at: expiryEnabled ? `${expiryDate}T${expiryTime}:00Z` : null,
    expiry_timezone: expiryTimezone,
    expiry_heading: expiryHeading,
    expiry_message: expiryMessage,
    music_url: enabledFeatures.music ? 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' : undefined,
    music_title: 'Gentle Moments',
    memories,
    timeline_entries: timelineEntries,
    quiz_questions: quizQuestions,
    secret_messages: secretMessages,
    letters,
    wishes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulating save to database
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublishedSuccess(true);
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5">
        <div>
          <span className="text-xs font-semibold text-platform-violet uppercase tracking-wider">
            Step-by-Step Creator
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
            Gift Creation Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/gifts"
            className="px-4 py-2 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5 transition-colors"
          >
            Cancel & Exit
          </Link>
        </div>
      </div>

      {/* Step Progress Indicator */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-platform-muted mb-3 font-medium">
          <span>Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-platform-dark"
            initial={{ width: '10%' }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Form Content by Step */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-black/5 shadow-xs">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 1: Recipient & Event Details
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Who is this gift for, and what special occasion are we celebrating?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Maya, Ananya, Kabir"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Gift Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Little Universe for Maya"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-white"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Friendship">Friendship</option>
                  <option value="Appreciation">Appreciation</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Custom URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-black/5 text-xs text-platform-muted border border-r-0 border-black/10 rounded-l-xl">
                    dearyou.com/g/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="maya-surprise"
                    className="w-full px-4 py-3 rounded-r-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Theme Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 2: Choose Visual Theme
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Each gift possesses its own unique aesthetic identity. Select an atmospheric preset or create a custom palette.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(THEME_PRESETS).map(([id, theme]) => {
                const isSelected = selectedTheme === id;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedTheme(id as ThemeId)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-platform-violet bg-purple-50/50 shadow-md scale-[1.01]'
                        : 'border-black/5 hover:border-black/20 bg-white'
                    }`}
                  >
                    <div>
                      {/* Gradient preview bar */}
                      <div
                        className={`w-full h-20 rounded-xl bg-gradient-to-r ${theme.previewGradient} shadow-inner mb-4 flex items-center justify-center`}
                      >
                        <span className="text-white text-xs font-medium px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                          {theme.badge}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-semibold text-platform-dark">
                        {theme.name}
                      </h3>
                      <p className="text-xs text-platform-muted mt-1 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-medium">
                      <span className="text-platform-muted">{theme.typography.headingFont}</span>
                      {isSelected ? (
                        <span className="text-platform-violet font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="text-platform-muted">Select</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Custom Theme Card */}
              <div
                onClick={() => setSelectedTheme('custom')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedTheme === 'custom'
                    ? 'border-platform-violet bg-purple-50/50 shadow-md'
                    : 'border-black/5 hover:border-black/20 bg-white'
                }`}
              >
                <div>
                  <div className="w-full h-20 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-inner mb-4 flex items-center justify-center">
                    <span className="text-white text-xs font-medium px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                      ⚙ Custom Theme
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-platform-dark">
                    Custom Colors & Fonts
                  </h3>
                  <p className="text-xs text-platform-muted mt-1 leading-relaxed">
                    Define custom primary, secondary, background colors, and font styles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 text-right">
                  {selectedTheme === 'custom' ? (
                    <span className="text-platform-violet text-xs font-semibold flex items-center justify-end gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  ) : (
                    <span className="text-platform-muted text-xs">Configure</span>
                  )}
                </div>
              </div>
            </div>

            {/* If Custom Theme selected, show color controls */}
            {selectedTheme === 'custom' && (
              <div className="p-5 rounded-2xl bg-black/5 border border-black/10 mt-6 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-platform-dark">
                  Custom Theme Palette
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] text-platform-muted mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={customTheme.primaryColor}
                      onChange={(e) => setCustomTheme({ ...customTheme, primaryColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer border border-black/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-platform-muted mb-1">Secondary Color</label>
                    <input
                      type="color"
                      value={customTheme.secondaryColor}
                      onChange={(e) => setCustomTheme({ ...customTheme, secondaryColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer border border-black/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-platform-muted mb-1">Background</label>
                    <input
                      type="color"
                      value={customTheme.backgroundColor}
                      onChange={(e) => setCustomTheme({ ...customTheme, backgroundColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer border border-black/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-platform-muted mb-1">Accent</label>
                    <input
                      type="color"
                      value={customTheme.accentColor}
                      onChange={(e) => setCustomTheme({ ...customTheme, accentColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer border border-black/10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Welcome Screen */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 3: Welcome Introduction
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                The opening greeting shown right after entering the password.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Opening Headline
                </label>
                <input
                  type="text"
                  value={welcomeHeading}
                  onChange={(e) => setWelcomeHeading(e.target.value)}
                  placeholder="e.g. Someone has created a little something special for you."
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Introduction Body Message
                </label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="A warm introductory note..."
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Opening Button Label
                </label>
                <input
                  type="text"
                  value={welcomeButtonText}
                  onChange={(e) => setWelcomeButtonText(e.target.value)}
                  placeholder="Open Your Surprise"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Personal Content */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 4: Personal Letters & Messages
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Compose heartfelt letters, closing words, and hidden surprises.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Personal Letter Heading
                </label>
                <input
                  type="text"
                  value={letters[0]?.heading || ''}
                  onChange={(e) =>
                    setLetters([{ ...letters[0], heading: e.target.value, content: letters[0]?.content || '', display_order: 1 }])
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Personal Letter Content (Supports multiple paragraphs)
                </label>
                <textarea
                  rows={6}
                  value={letters[0]?.content || ''}
                  onChange={(e) =>
                    setLetters([{ ...letters[0], heading: letters[0]?.heading || '', content: e.target.value, display_order: 1 }])
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none font-light leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Final Closing Farewell Message
                </label>
                <textarea
                  rows={3}
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Media Upload */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 5: Media & Photo Gallery
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Add memorable snapshots with captions and dates.
              </p>
            </div>

            <div className="space-y-4">
              {memories.map((m, index) => (
                <div
                  key={m.id || index}
                  className="p-4 rounded-2xl bg-black/5 border border-black/10 flex flex-col sm:flex-row items-center gap-4"
                >
                  <img
                    src={m.image_path}
                    alt={m.caption}
                    className="w-24 h-24 rounded-xl object-cover shrink-0 bg-white"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={m.caption}
                      onChange={(e) => {
                        const updated = [...memories];
                        updated[index].caption = e.target.value;
                        setMemories(updated);
                      }}
                      placeholder="Caption for this memory..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-black/10 text-xs"
                    />
                    <input
                      type="date"
                      value={m.memory_date || ''}
                      onChange={(e) => {
                        const updated = [...memories];
                        updated[index].memory_date = e.target.value;
                        setMemories(updated);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setMemories(memories.filter((_, i) => i !== index))}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={() =>
                  setMemories([
                    ...memories,
                    {
                      id: `m-${Date.now()}`,
                      image_path: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
                      caption: 'Another unforgettable memory.',
                      memory_date: '2025-01-01',
                      display_order: memories.length + 1,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-black/20 text-xs font-medium text-platform-dark hover:bg-black/5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Feature Selection */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 6: Feature Toggles
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Enable or disable each interactive module individually. Disabled features will not appear in the recipient's journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'gift_box', label: 'Virtual Gift Box Reveal', desc: 'Interactive animated gift box with ribbon & confetti' },
                { id: 'celebration', label: 'Virtual Birthday Cake & Candle', desc: 'Blowable candles with realistic flames & wishes' },
                { id: 'memories', label: 'Memories Photo Gallery', desc: 'Polaroid & grid photo gallery with lightbox' },
                { id: 'timeline', label: 'Memory Timeline', desc: 'Chronological journey milestones' },
                { id: 'quiz', label: 'Friendship / Memory Quiz', desc: 'Interactive trivia with score calculation' },
                { id: 'scratch_card', label: 'Golden Scratch Card', desc: 'Touch and pointer scratch-to-reveal card' },
                { id: 'secret_messages', label: 'Secret Messages', desc: 'Tap-to-unseal confidential notes' },
                { id: 'future_wishes', label: 'Future Wishes Carousel', desc: 'Step-by-step blessing cards' },
                { id: 'letters', label: 'Personal Letter', desc: 'Rich typography heartfelt letter' },
                { id: 'music', label: 'Background Music Player', desc: 'Ambient audio bar without forced autoplay' },
              ].map((feat) => {
                const isEnabled = enabledFeatures[feat.id] ?? true;

                return (
                  <div
                    key={feat.id}
                    onClick={() =>
                      setEnabledFeatures({
                        ...enabledFeatures,
                        [feat.id]: !isEnabled,
                      })
                    }
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isEnabled
                        ? 'border-platform-violet/40 bg-purple-50/30'
                        : 'border-black/5 bg-black/5 opacity-60'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-platform-dark">
                        {feat.label}
                      </h4>
                      <p className="text-[11px] text-platform-muted mt-0.5">{feat.desc}</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 ${
                        isEnabled ? 'bg-platform-violet text-white' : 'bg-black/20 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: Feature Configuration */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 7: Interactive Module Settings
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Customize content for the interactive features you enabled.
              </p>
            </div>

            <div className="space-y-6">
              {/* Scratch Card Config */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/5 border border-black/10">
                <h4 className="text-xs font-semibold text-platform-dark mb-1">
                  Scratch Card Hidden Message
                </h4>
                <input
                  type="text"
                  value={scratchCardHiddenText}
                  onChange={(e) => setScratchCardHiddenText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm"
                />
              </div>

              {/* Gift Box Reveal Config */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/5 border border-black/10">
                <h4 className="text-xs font-semibold text-platform-dark mb-1">
                  Gift Box Surprise Note
                </h4>
                <input
                  type="text"
                  value={giftBoxMessage}
                  onChange={(e) => setGiftBoxMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm"
                />
              </div>

              {/* Secret Messages Config */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/5 border border-black/10">
                <h4 className="text-xs font-semibold text-platform-dark mb-2">
                  Secret Message #1
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={secretMessages[0]?.title || ''}
                    onChange={(e) =>
                      setSecretMessages([
                        { ...secretMessages[0], title: e.target.value, content: secretMessages[0]?.content || '', reveal_type: 'tap', display_order: 1 },
                      ])
                    }
                    placeholder="Title / Whisper label"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                  />
                  <textarea
                    rows={2}
                    value={secretMessages[0]?.content || ''}
                    onChange={(e) =>
                      setSecretMessages([
                        { ...secretMessages[0], title: secretMessages[0]?.title || '', content: e.target.value, reveal_type: 'tap', display_order: 1 },
                      ])
                    }
                    placeholder="Hidden note content..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Expiry Settings */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 8: Gift Expiration & Closure
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Optionally set a time-bound expiry. When reached, the gift gracefully transitions to a personalized closing farewell.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-black/10 bg-black/5">
                <input
                  type="checkbox"
                  id="enableExpiry"
                  checked={expiryEnabled}
                  onChange={(e) => setExpiryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-platform-violet cursor-pointer"
                />
                <label htmlFor="enableExpiry" className="text-xs sm:text-sm font-medium text-platform-dark cursor-pointer">
                  Enable Gift Expiry Date & Time
                </label>
              </div>

              {expiryEnabled && (
                <div className="p-5 rounded-2xl bg-white border border-black/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-platform-dark mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-platform-dark mb-1">
                        Expiry Time
                      </label>
                      <input
                        type="time"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-platform-dark mb-1">
                        Time Zone
                      </label>
                      <input
                        type="text"
                        value={expiryTimezone}
                        onChange={(e) => setExpiryTimezone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs bg-black/5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1">
                      Post-Expiry Heading
                    </label>
                    <input
                      type="text"
                      value={expiryHeading}
                      onChange={(e) => setExpiryHeading(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1">
                      Post-Expiry Custom Message
                    </label>
                    <textarea
                      rows={3}
                      value={expiryMessage}
                      onChange={(e) => setExpiryMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: Password & Access */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                Step 9: Password & Access Gate
              </h2>
              <p className="mt-1 text-xs text-platform-muted">
                Protect this experience with a private access code only the recipient knows.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Gift Access Password *
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. starrynight, special, 2511"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                  Password Hint (Optional)
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="e.g. The nickname you call me"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                Passwords are encrypted using server-side salt hashing (Bcrypt). The recipient will need to enter this code on the landing gate to unlock their surprise.
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Preview & Publish */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                  Step 10: Final Review & Publish
                </h2>
                <p className="mt-1 text-xs text-platform-muted">
                  Test the interactive recipient experience before sharing the link.
                </p>
              </div>

              {/* Device Preview Toggle */}
              <div className="inline-flex items-center p-1 rounded-xl bg-black/5 border border-black/10 shrink-0">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white shadow-xs text-platform-dark' : 'text-platform-muted'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white shadow-xs text-platform-dark' : 'text-platform-muted'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Embedded Live Preview Container */}
            <div className="flex justify-center p-4 bg-stone-900 rounded-3xl overflow-hidden border border-black/10">
              <div
                className={`transition-all duration-300 overflow-y-auto max-h-[600px] rounded-2xl bg-black ${
                  previewDevice === 'mobile' ? 'w-[380px] border-4 border-stone-700 shadow-2xl' : 'w-full'
                }`}
              >
                <RecipientExperience gift={previewGift} initialUnlocked={true} />
              </div>
            </div>

            {/* Publish Confirmation Box */}
            <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-base font-semibold text-purple-950">
                  Ready to make {recipientName}'s day special?
                </h4>
                <p className="text-xs text-purple-800/80 mt-0.5">
                  Publishing will activate the URL: <code>/g/{slug}</code> with password protection.
                </p>
              </div>

              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-3 rounded-xl bg-platform-dark text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Confirm & Publish Gift'}
              </button>
            </div>

            {isPublishedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span>Gift published successfully! Link is now live.</span>
                <Link
                  href={`/g/${slug}`}
                  target="_blank"
                  className="font-semibold underline flex items-center gap-1"
                >
                  <span>Open Recipient Link</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="mt-10 pt-6 border-t border-black/5 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-platform-dark text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/admin/gifts"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
            >
              <span>Finish & View All Gifts</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return 'Basic Information';
    case 2:
      return 'Theme Selection';
    case 3:
      return 'Welcome & Greeting';
    case 4:
      return 'Personal Content';
    case 5:
      return 'Media & Photos';
    case 6:
      return 'Feature Selection';
    case 7:
      return 'Feature Configuration';
    case 8:
      return 'Gift Expiry';
    case 9:
      return 'Password & Access';
    case 10:
      return 'Preview & Publish';
    default:
      return '';
  }
}
