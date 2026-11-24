'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Palette,
  Eye,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Lock,
  Music,
  Share2,
  ExternalLink,
  ChevronRight,
  Heart,
  Gift,
  HelpCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  EventType,
  MemoryItem,
  WallLayoutMode,
  TimelineEntry,
  QuizQuestion,
  SecretMessage,
  GiftLetter,
  Gift as GiftType,
  FrameStyle,
  FrameSize,
} from '@/types/gift';
import { ThemeId, CustomThemeConfig } from '@/types/theme';
import { THEME_PRESETS } from '@/config/themes';
import { LivePreviewPane } from '@/components/admin/LivePreviewPane';

interface WizardPageConfig {
  step: number;
  id: string;
  label: string;
  shortLabel: string;
  previewSectionId: string;
  description: string;
}

const WIZARD_PAGES: WizardPageConfig[] = [
  {
    step: 1,
    id: 'welcome',
    label: 'Page 1 — Cover & Welcome',
    shortLabel: 'Cover',
    previewSectionId: 'welcome',
    description: 'Title, recipient name, cover photograph, greeting message & visual theme',
  },
  {
    step: 2,
    id: 'gift_box',
    label: 'Page 2 — Surprise Gift Reveal',
    shortLabel: 'Gift Reveal',
    previewSectionId: 'gift_box',
    description: 'Interactive gift box unwrapping & secret reveal message',
  },
  {
    step: 3,
    id: 'memory_wall',
    label: 'Page 3 — The Memory Wall',
    shortLabel: 'Memory Wall',
    previewSectionId: 'memory_wall',
    description: 'Hanging frames, photograph gallery, memories & captions',
  },
  {
    step: 4,
    id: 'celebration',
    label: 'Page 4 — Interactive Celebrations',
    shortLabel: 'Celebrations',
    previewSectionId: 'celebration',
    description: 'Candle-blowing cake, timeline milestones, trivia quiz & future wishes',
  },
  {
    step: 5,
    id: 'closing',
    label: 'Page 5 — Letters & Farewell',
    shortLabel: 'Farewell',
    previewSectionId: 'closing',
    description: 'Heartfelt letters, closing parting words & scheduled expiry countdown',
  },
  {
    step: 6,
    id: 'publish',
    label: 'Page 6 — Security & Publish',
    shortLabel: 'Publish',
    previewSectionId: 'password',
    description: 'Recipient password protection, access verification & live launch',
  },
];

export default function GiftBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = WIZARD_PAGES.length;
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State - Page 1: Cover & Welcome
  const [recipientName, setRecipientName] = useState('Ananya');
  const [title, setTitle] = useState('A Celestial Surprise for Ananya');
  const [eventType, setEventType] = useState<EventType>('Birthday');
  const [eventDate, setEventDate] = useState('2026-11-25');
  const [slug, setSlug] = useState('ananya-birthday');
  const [introduction, setIntroduction] = useState('A little universe crafted just for you.');
  const [coverImage, setCoverImage] = useState('');
  const [welcomeHeading, setWelcomeHeading] = useState('A starry sanctuary, crafted with love.');
  const [welcomeMessage, setWelcomeMessage] = useState('Take a breath, relax, and step into this moment prepared for you.');
  const [welcomeButtonText, setWelcomeButtonText] = useState('Start Your Journey');

  // Theme State
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

  // Page 2: Surprise Gift Reveal
  const [giftBoxMessage, setGiftBoxMessage] = useState('May this year bring gentle days, deep laughter, and wishes fulfilled.');
  const [scratchCardHiddenText, setScratchCardHiddenText] = useState('You make every room brighter simply by walking into it.');

  // Page 3: Media & Memory Wall / Gallery
  const [wallLayoutMode, setWallLayoutMode] = useState<WallLayoutMode>('both');
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'm1',
      image_path: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
      caption: 'The rooftop coffee where we talked until the city lights came on.',
      memory_date: '2024-03-14',
      display_order: 1,
      frame_style: 'polaroid',
      frame_size: 'medium',
      rotation: -3,
    },
    {
      id: 'm2',
      image_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      caption: 'Unforgettable monsoon road trip in the misty hills.',
      memory_date: '2024-07-22',
      display_order: 2,
      frame_style: 'vintage_wood',
      frame_size: 'large',
      rotation: 2.5,
    },
    {
      id: 'm3',
      image_path: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
      caption: 'Laughing so hard we couldn’t breathe during game night.',
      memory_date: '2025-01-05',
      display_order: 3,
      frame_style: 'golden_luxury',
      frame_size: 'medium',
      rotation: -2,
    },
  ]);

  // Page 4: Interactive Celebrations & Features
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    gift_box: true,
    celebration: true,
    memory_wall: true,
    memories: true,
    timeline: true,
    quiz: true,
    scratch_card: true,
    secret_messages: true,
    future_wishes: true,
    letters: true,
    music: true,
  });

  const [wishes, setWishes] = useState<string[]>([
    'May you keep chasing wonders with that fearless smile.',
    'Wishing you cozy rainy afternoons with your favourite books.',
    'May our conversations always feel like coming home.',
  ]);

  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([
    {
      id: 't1',
      event_date: 'October 12, 2023',
      title: 'The First Hello',
      description: 'At that quiet cafe in Sector 15. We ordered hot chocolate and stayed until closing.',
      display_order: 1,
    },
    {
      id: 't2',
      event_date: 'July 22, 2024',
      title: 'Monsoon Roadtrip',
      description: 'Singing old songs in the car while mist covered the mountain curves.',
      display_order: 2,
    },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: 'Where did we take our very first photo together?',
      display_order: 1,
      options: [
        { id: 'qo1', option_text: 'Rooftop Cafe', is_correct: true, display_order: 1 },
        { id: 'qo2', option_text: 'Metro Station', is_correct: false, display_order: 2 },
        { id: 'qo3', option_text: 'Botanical Gardens', is_correct: false, display_order: 3 },
        { id: 'qo4', option_text: 'Bookstore', is_correct: false, display_order: 4 },
      ],
    },
  ]);

  const [secretMessages, setSecretMessages] = useState<SecretMessage[]>([
    {
      id: 's1',
      title: 'Tap to unlock a confession from that winter evening...',
      content: 'I knew you were special the very second you laughed at my terrible jokes.',
      reveal_type: 'tap',
      display_order: 1,
    },
  ]);

  // Page 5: Letters & Farewell
  const [letters, setLetters] = useState<GiftLetter[]>([
    {
      id: 'l1',
      heading: 'A letter from the heart',
      content:
        'Dear Ananya,\n\nSome moments in life feel like gentle stars guiding us through the dark. Having you in my world has been the sweetest gift. Thank you for the laughs that heal, the quiet moments that comfort, and every single memory in between.\n\nHappy Birthday, today and every single day.',
      display_order: 1,
    },
  ]);
  const [closingMessage, setClosingMessage] = useState('No matter where life leads, know that you are loved and cherished.');
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [expiryTime, setExpiryTime] = useState('23:59');
  const [expiryTimezone, setExpiryTimezone] = useState('Asia/Kolkata');
  const [expiryHeading, setExpiryHeading] = useState('Until We Meet Again in Memory');
  const [expiryMessage, setExpiryMessage] = useState('This digital gift has completed its scheduled journey. The memories and laughter we shared remain immortal.');

  // Page 6: Password & Access
  const [password, setPassword] = useState('ananya2026');
  const [passwordHint, setPasswordHint] = useState('Our favourite rooftop cafe');

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Active section mapping for live preview
  const activeSectionId = WIZARD_PAGES[currentStep - 1]?.previewSectionId || 'welcome';

  // Bidirectional Page Synchronisation: When preview scrolls, sync wizard navigation
  const handlePreviewSectionVisible = useCallback((sectionId: string) => {
    let targetStep = 1;
    if (sectionId === 'gift_box' || sectionId === 'scratch_card') {
      targetStep = 2;
    } else if (sectionId === 'memory_wall' || sectionId === 'memories') {
      targetStep = 3;
    } else if (
      sectionId === 'celebration' ||
      sectionId === 'timeline' ||
      sectionId === 'quiz' ||
      sectionId === 'future_wishes' ||
      sectionId === 'secret_messages'
    ) {
      targetStep = 4;
    } else if (sectionId === 'letters' || sectionId === 'closing') {
      targetStep = 5;
    } else if (sectionId === 'welcome') {
      targetStep = 1;
    }

    setCurrentStep((prev) => (prev !== targetStep ? targetStep : prev));
  }, []);

  const handleStartFresh = () => {
    setRecipientName('');
    setTitle('');
    setSlug('');
    setCoverImage('');
    setIntroduction('');
    setWelcomeHeading('A special surprise crafted with love.');
    setWelcomeMessage('Take a breath, relax, and step into this moment prepared for you.');
    setWelcomeButtonText('Start Your Journey');
    setGiftBoxMessage('');
    setScratchCardHiddenText('');
    setClosingMessage('');
    setMemories([]);
    setWishes([]);
    setTimelineEntries([]);
    setQuizQuestions([]);
    setSecretMessages([]);
    setLetters([]);
    setPassword('');
    setPasswordHint('');
    setCurrentStep(1);
  };

  // Upload handler for memories
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMemories: MemoryItem[] = Array.from(files).map((file, idx) => ({
      id: `mem-${Date.now()}-${idx}`,
      image_path: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      memory_date: new Date().toISOString().split('T')[0],
      display_order: memories.length + idx + 1,
      frame_style: 'polaroid',
      frame_size: 'medium',
      rotation: (idx % 2 === 0 ? -2.5 : 2.5),
    }));

    setMemories([...memories, ...newMemories]);
    e.target.value = '';
  };

  // Construct reactive Live Preview Gift object
  const previewGift: GiftType = {
    id: 'builder-preview',
    recipient_name: recipientName || 'Recipient',
    title: title || 'A Special Surprise',
    slug: slug || 'surprise',
    event_type: eventType,
    event_date: eventDate,
    cover_image: coverImage || undefined,
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
    memory_wall_config: {
      layout_mode: wallLayoutMode,
      enable_hanging_effect: true,
    },
    sections: [
      { id: '1', section_type: 'gift_box', display_order: 1, enabled: enabledFeatures.gift_box ?? true },
      { id: '2', section_type: 'celebration', display_order: 2, enabled: enabledFeatures.celebration ?? true },
      { id: '3', section_type: 'memory_wall', display_order: 3, enabled: (enabledFeatures.memory_wall ?? true) && (wallLayoutMode === 'both' || wallLayoutMode === 'auto') },
      { id: '4', section_type: 'memories', display_order: 4, enabled: (enabledFeatures.memories ?? true) && (wallLayoutMode === 'both' || wallLayoutMode === 'manual') },
      { id: '5', section_type: 'timeline', display_order: 5, enabled: enabledFeatures.timeline ?? true },
      { id: '6', section_type: 'quiz', display_order: 6, enabled: enabledFeatures.quiz ?? true },
      { id: '7', section_type: 'scratch_card', display_order: 7, enabled: enabledFeatures.scratch_card ?? true },
      { id: '8', section_type: 'secret_messages', display_order: 8, enabled: enabledFeatures.secret_messages ?? true },
      { id: '9', section_type: 'future_wishes', display_order: 9, enabled: enabledFeatures.future_wishes ?? true },
      { id: '10', section_type: 'letters', display_order: 10, enabled: enabledFeatures.letters ?? true },
      { id: '11', section_type: 'closing', display_order: 11, enabled: enabledFeatures.closing ?? true },
    ],
    memories,
    timeline_entries: timelineEntries,
    quiz_questions: quizQuestions,
    secret_messages: secretMessages,
    letters,
    wishes: wishes.map((w, idx) => ({
      id: `w${idx + 1}`,
      wish_text: w,
      display_order: idx + 1,
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);

    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipientName,
          title,
          slug,
          event_type: eventType,
          event_date: eventDate,
          cover_image: coverImage || undefined,
          selected_theme: selectedTheme,
          theme_config: selectedTheme === 'custom' ? customTheme : undefined,
          introduction,
          welcome_heading: welcomeHeading,
          welcome_message: welcomeMessage,
          welcome_button_text: welcomeButtonText,
          gift_box_message: giftBoxMessage,
          scratch_card_hidden_text: scratchCardHiddenText,
          closing_message: closingMessage,
          password,
          password_hint: passwordHint,
          expiry_enabled: expiryEnabled,
          expires_at: expiryEnabled ? `${expiryDate}T${expiryTime}:00Z` : null,
          expiry_timezone: expiryTimezone,
          expiry_heading: expiryHeading,
          expiry_message: expiryMessage,
          music_url: enabledFeatures.music ? 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' : undefined,
          music_title: 'Gentle Moments',
          memory_wall_config: { layout_mode: wallLayoutMode, enable_hanging_effect: true },
          sections: previewGift.sections,
          memories,
          timeline_entries: timelineEntries,
          quiz_questions: quizQuestions,
          secret_messages: secretMessages,
          letters,
          wishes: wishes.map((w, idx) => ({
            id: `w${idx + 1}`,
            wish_text: w,
            display_order: idx + 1,
          })),
          status: 'published',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error || 'Failed to publish card.');
      } else {
        setPublishedSlug(data.gift.slug);
        setIsPublishedSuccess(true);
      }
    } catch {
      setPublishError('Network error while publishing gift.');
    } finally {
      setIsPublishing(false);
    }
  };

  const activePageConfig = WIZARD_PAGES[currentStep - 1];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-platform-dark tracking-tight">
              Gift Creator Studio
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Live Synchronised
            </span>
          </div>
          <p className="text-xs sm:text-sm text-platform-muted mt-1">
            Build your gift page by page. The preview on the right navigates automatically to match your active section.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleStartFresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 text-xs font-medium text-platform-muted hover:text-platform-dark hover:bg-black/5 transition-colors cursor-pointer"
            title="Clear all prefilled content and start with a blank card"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh</span>
          </button>

          {/* Mobile Preview Trigger Button */}
          <button
            onClick={() => setShowMobilePreview(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-platform-violet text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>

          <Link
            href="/admin/gifts"
            className="px-4 py-2 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5 transition-colors"
          >
            Cancel & Exit
          </Link>
        </div>
      </div>

      {/* Two-Panel Workspace on Desktop / Single Column on Mobile */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* ======================================================== */}
        {/* LEFT PANEL: CREATOR EDITOR (45% width on desktop)        */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[45%] xl:w-[42%] space-y-6">
          {/* Step Progress Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-platform-muted mb-3 font-medium">
              <span className="font-semibold text-platform-dark">
                {activePageConfig.label}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-platform-dark"
                initial={{ width: '16%' }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Quick Step Jump Tabs with Exact Page Names */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium text-platform-muted scrollbar-none">
              {WIZARD_PAGES.map((page) => (
                <button
                  key={page.step}
                  onClick={() => setCurrentStep(page.step)}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentStep === page.step
                      ? 'bg-platform-dark text-white font-semibold shadow-xs'
                      : 'hover:bg-black/5 text-platform-dark'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                    {page.step}
                  </span>
                  <span>{page.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs">
            {/* PAGE 1: Cover & Welcome */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 1: Cover, Welcome & Visual Theme
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Set up who this gift is for, the opening cover atmosphere, and choose its bespoke theme palette.
                  </p>
                </div>

                <div className="space-y-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                        Occasion Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-white"
                      >
                        <option value="Birthday">Birthday</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Valentine">Valentine&apos;s Day</option>
                        <option value="Congratulations">Congratulations</option>
                        <option value="Farewell">Farewell</option>
                        <option value="Just Because">Just Because</option>
                        <option value="Custom">Custom Celebration</option>
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
                        className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                      >
                      </input>
                    </div>
                  </div>

                  {/* Welcome Greeting */}
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Welcome Heading
                    </label>
                    <input
                      type="text"
                      value={welcomeHeading}
                      onChange={(e) => setWelcomeHeading(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Welcome Message
                    </label>
                    <textarea
                      rows={2}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Cover Button Text
                    </label>
                    <input
                      type="text"
                      value={welcomeButtonText}
                      onChange={(e) => setWelcomeButtonText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  {/* Visual Theme Selection */}
                  <div className="pt-4 border-t border-black/5">
                    <label className="block text-xs font-semibold text-platform-dark mb-3 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-platform-violet" />
                      <span>Choose Visual Theme & Atmosphere</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.values(THEME_PRESETS).map((theme) => {
                        const isSelected = selectedTheme === theme.id;
                        return (
                          <div
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme.id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-platform-violet bg-purple-50/40 ring-2 ring-platform-violet/30 shadow-xs'
                                : 'border-black/5 hover:border-black/20 bg-stone-50/50'
                            }`}
                          >
                            <div
                              className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.previewGradient} shadow-inner mb-2`}
                            />
                            <div className="flex items-center justify-between">
                              <span className="font-serif text-xs font-medium text-platform-dark block truncate">
                                {theme.name}
                              </span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-platform-violet shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: Surprise Gift Reveal & Special Messages */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 2: Surprise Gift Reveal
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    When the recipient taps the wrapped gift box, it unties to reveal this hidden message.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Gift Box Secret Message *
                    </label>
                    <textarea
                      rows={4}
                      value={giftBoxMessage}
                      onChange={(e) => setGiftBoxMessage(e.target.value)}
                      placeholder="Write the heartfelt revelation that appears when the gift unties..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Scratch Card Hidden Note
                    </label>
                    <input
                      type="text"
                      value={scratchCardHiddenText}
                      onChange={(e) => setScratchCardHiddenText(e.target.value)}
                      placeholder="Hidden until recipient scratches with cursor or fingertip..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: The Memory Wall */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 3: The Memory Wall & Photographs
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Upload photographs into physical hanging frames with customizable tilt angles, frame styles, and captions.
                  </p>
                </div>

                {/* Upload Trigger */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-purple-200 hover:border-platform-violet bg-purple-50/50 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-platform-violet/10 text-platform-violet flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-platform-dark">
                      Upload Photos for the Memory Wall
                    </span>
                    <span className="text-[11px] text-platform-muted">
                      JPG, PNG, WebP up to 10MB each
                    </span>
                  </button>
                </div>

                {/* Photo List */}
                <div className="space-y-4">
                  {memories.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="p-4 rounded-2xl border border-black/5 bg-stone-50/40 space-y-3"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={photo.image_path}
                          alt={photo.caption || 'Memory thumbnail'}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-black/10 bg-black/5"
                        />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) => {
                              const updated = [...memories];
                              updated[idx].caption = e.target.value;
                              setMemories(updated);
                            }}
                            placeholder="Write a caption for this memory..."
                            className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-xs focus:outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <select
                              value={photo.frame_style || 'polaroid'}
                              onChange={(e) => {
                                const updated = [...memories];
                                updated[idx].frame_style = e.target.value as FrameStyle;
                                setMemories(updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
                            >
                              <option value="polaroid">Polaroid Style</option>
                              <option value="vintage_wood">Vintage Wood</option>
                              <option value="golden_luxury">Golden Luxury</option>
                              <option value="scrapbook">Scrapbook Paper</option>
                              <option value="pastel">Pastel Dream</option>
                              <option value="minimal">Minimal Modern</option>
                            </select>
                            <input
                              type="date"
                              value={photo.memory_date || ''}
                              onChange={(e) => {
                                const updated = [...memories];
                                updated[idx].memory_date = e.target.value;
                                setMemories(updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMemories(memories.filter((_, i) => i !== idx))}
                          className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAGE 4: Interactive Celebrations */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 4: Interactive Celebrations & Milestones
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Configure interactive modules: birthday candle blowing, timeline milestones, and background music.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Music Toggle */}
                  <div className="p-4 rounded-xl border border-black/5 bg-purple-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-platform-violet" />
                      <div>
                        <span className="text-xs font-semibold text-platform-dark block">
                          Background Audio Soundtrack
                        </span>
                        <span className="text-[11px] text-platform-muted">
                          Plays softly when recipient clicks &quot;Start Your Journey&quot;
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.music ?? true}
                      onChange={(e) =>
                        setEnabledFeatures({ ...enabledFeatures, music: e.target.checked })
                      }
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                  </div>

                  {/* Cake & Wishes */}
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Celebration Wishes & Cake Message
                    </label>
                    <div className="space-y-2">
                      {wishes.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={w}
                            onChange={(e) => {
                              const updated = [...wishes];
                              updated[idx] = e.target.value;
                              setWishes(updated);
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-black/10 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setWishes(wishes.filter((_, i) => i !== idx))}
                            className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setWishes([...wishes, 'Another sweet wish for you!'])}
                        className="text-xs text-platform-violet hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Wish
                      </button>
                    </div>
                  </div>

                  {/* Timeline Milestones */}
                  <div className="pt-4 border-t border-black/5">
                    <label className="block text-xs font-semibold text-platform-dark mb-2">
                      Timeline Milestones ({timelineEntries.length})
                    </label>
                    <div className="space-y-3">
                      {timelineEntries.map((t, idx) => (
                        <div key={t.id || idx} className="p-3 rounded-xl border border-black/10 bg-white space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={t.event_date}
                              onChange={(e) => {
                                const up = [...timelineEntries];
                                up[idx].event_date = e.target.value;
                                setTimelineEntries(up);
                              }}
                              placeholder="Date / Month"
                              className="px-2 py-1 rounded border border-black/10"
                            />
                            <input
                              type="text"
                              value={t.title}
                              onChange={(e) => {
                                const up = [...timelineEntries];
                                up[idx].title = e.target.value;
                                setTimelineEntries(up);
                              }}
                              placeholder="Milestone Title"
                              className="px-2 py-1 rounded border border-black/10 font-semibold"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={t.description}
                            onChange={(e) => {
                              const up = [...timelineEntries];
                              up[idx].description = e.target.value;
                              setTimelineEntries(up);
                            }}
                            placeholder="What made this moment special?"
                            className="w-full px-2 py-1 rounded border border-black/10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5: Letters & Farewell */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 5: Letters & Closing Farewell
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Draft personal heartfelt letters and set an optional scheduled expiry date.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Personal Letter Content *
                    </label>
                    <textarea
                      rows={6}
                      value={letters[0]?.content || ''}
                      onChange={(e) => {
                        const updated = [...letters];
                        if (!updated[0]) {
                          updated[0] = {
                            id: 'l1',
                            heading: 'A letter from the heart',
                            content: e.target.value,
                            display_order: 1,
                          };
                        } else {
                          updated[0].content = e.target.value;
                        }
                        setLetters(updated);
                      }}
                      placeholder="Write your long-form letter..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm font-serif leading-relaxed focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Closing Farewell Message
                    </label>
                    <textarea
                      rows={3}
                      value={closingMessage}
                      onChange={(e) => setClosingMessage(e.target.value)}
                      placeholder="Final words at the very bottom of the card journey..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  {/* Scheduled Expiry Toggle */}
                  <div className="pt-4 border-t border-black/5">
                    <div className="p-4 rounded-xl border border-black/5 bg-amber-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span className="text-xs font-semibold text-stone-900">
                            Time-Bound Expiry (Optional)
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={expiryEnabled}
                          onChange={(e) => setExpiryEnabled(e.target.checked)}
                          className="w-4 h-4 accent-amber-600 rounded"
                        />
                      </div>
                      {expiryEnabled && (
                        <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-black/10 bg-white"
                          />
                          <input
                            type="time"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-black/10 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 6: Security & Publish */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Page 6: Security & Final Launch
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Protect the card with a recipient password, review the link, and launch it live!
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-platform-violet" />
                      <span>Recipient Access Password *</span>
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. ananya2026"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Password Hint (Displayed to Recipient)
                    </label>
                    <input
                      type="text"
                      value={passwordHint}
                      onChange={(e) => setPasswordHint(e.target.value)}
                      placeholder="e.g. The name of the cafe where we met"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Custom URL Slug
                    </label>
                    <div className="flex items-center px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm bg-stone-50">
                      <span className="text-platform-muted font-mono">/g/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-1 bg-transparent font-mono font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {publishError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {publishError}
                    </div>
                  )}

                  {isPublishedSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                      <h3 className="font-serif text-lg text-emerald-950 font-medium">
                        Gift Published Live!
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Your gift is live and accessible at:
                      </p>
                      <Link
                        href={`/g/${publishedSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <span>Open Live Gift</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPublishing || !recipientName || !title || !password}
                      className="w-full py-4 rounded-2xl bg-platform-dark text-white text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isPublishing ? 'Publishing Gift...' : 'Publish Gift Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="mt-8 pt-5 border-t border-black/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-platform-dark text-white text-xs font-semibold hover:bg-black transition-all shadow-xs cursor-pointer"
                >
                  <span>Next: {WIZARD_PAGES[currentStep]?.shortLabel || 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href="/admin/gifts"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
                >
                  <span>Finish & Return</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: LIVE GIFT PREVIEW (55% width on desktop)    */}
        {/* ======================================================== */}
        <div className="hidden lg:block lg:w-[55%] xl:w-[58%] sticky top-6 h-[calc(100vh-60px)]">
          <LivePreviewPane
            gift={previewGift}
            activeSectionId={activeSectionId}
            onSectionVisible={handlePreviewSectionVisible}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE / TABLET FULL-SCREEN PREVIEW MODAL                */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <LivePreviewPane
              gift={previewGift}
              activeSectionId={activeSectionId}
              onSectionVisible={handlePreviewSectionVisible}
              isMobileDrawer={true}
              onCloseMobilePreview={() => setShowMobilePreview(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
