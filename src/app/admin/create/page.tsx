'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  Frame,
  Layers,
  RotateCw,
  RotateCcw,
  X,
} from 'lucide-react';
import { ThemeId, CustomThemeConfig } from '@/types/theme';
import {
  EventType,
  SectionType,
  MemoryItem,
  TimelineEntry,
  QuizQuestion,
  SecretMessage,
  GiftWish,
  GiftLetter,
  FrameStyle,
  FrameSize,
  WallLayoutMode,
} from '@/types/gift';
import { THEME_PRESETS, getThemeDefinition } from '@/config/themes';
import { Gift as GiftType } from '@/types/gift';
import { LivePreviewPane } from '@/components/admin/LivePreviewPane';

export default function GiftBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State - Step 1: Basic Information
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
  const [welcomeButtonText, setWelcomeButtonText] = useState('Start Your Journey');

  // Step 4: Personal Content
  const [giftBoxMessage, setGiftBoxMessage] = useState('May this year bring gentle days, deep laughter, and wishes fulfilled.');
  const [scratchCardHiddenText, setScratchCardHiddenText] = useState('You make every room brighter simply by walking into it.');
  const [closingMessage, setClosingMessage] = useState('No matter where life leads, know that you are loved and cherished.');

  // Step 5: Media & Memory Wall / Gallery
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

  // Step 6: Feature Toggles
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

  // Step 10: Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);

  // Clear draft to completely blank canvas
  const handleStartBlank = () => {
    setRecipientName('');
    setTitle('');
    setIntroduction('');
    setCoverImage('');
    setWelcomeHeading('');
    setWelcomeMessage('');
    setGiftBoxMessage('');
    setScratchCardHiddenText('');
    setClosingMessage('');
    setMemories([]);
    setTimelineEntries([]);
    setQuizQuestions([]);
    setSecretMessages([]);
    setLetters([]);
    setWishes([]);
    setPassword('');
    setPasswordHint('');
  };

  // Restore pre-filled demonstration draft template
  const handleLoadDemoTemplate = () => {
    setRecipientName('Ananya');
    setTitle('A Celestial Surprise for Ananya');
    setEventType('Birthday');
    setEventDate('2026-11-25');
    setSlug(`ananya-birthday-${Math.floor(100 + Math.random() * 900)}`);
    setIntroduction('A little universe crafted just for you.');
    setSelectedTheme('dreamy');
    setWelcomeHeading('A starry sanctuary, crafted with love.');
    setWelcomeMessage('Take a breath, relax, and step into this moment prepared for you.');
    setWelcomeButtonText('Start Your Journey');
    setGiftBoxMessage('May this year bring gentle days, deep laughter, and wishes fulfilled.');
    setScratchCardHiddenText('You make every room brighter simply by walking into it.');
    setClosingMessage('No matter where life leads, know that you are loved and cherished.');
    setMemories([
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
    setTimelineEntries([
      {
        id: 't1',
        title: 'The First Hello',
        description: 'Orientation hall where we ended up sharing notes and laughing together.',
        event_date: '2023-09-15',
        display_order: 1,
      },
    ]);
    setQuizQuestions([
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
    setSecretMessages([
      {
        id: 's1',
        title: 'Secret Appreciation',
        content: 'Your quiet kindness inspires everyone around you more than you know.',
        reveal_type: 'tap',
        display_order: 1,
      },
    ]);
    setLetters([
      {
        id: 'l1',
        heading: 'To the one who brings joy everywhere',
        content: 'Looking back over all our memories, I am endlessly grateful for your friendship. May this special milestone be everything you hoped for and more.',
        display_order: 1,
      },
    ]);
    setWishes([
      { id: 'w1', wish_text: 'Peace of mind and restful nights.', display_order: 1 },
      { id: 'w2', wish_text: 'Adventures that make your heart race with joy.', display_order: 2 },
    ]);
    setPassword('surprise2026');
    setPasswordHint('Our special year');
  };

  // Handle local photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMemories: MemoryItem[] = Array.from(files).map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      image_path: URL.createObjectURL(file), // instant local object URL for preview
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      memory_date: new Date().toISOString().split('T')[0],
      display_order: memories.length + idx + 1,
      frame_style: 'polaroid',
      frame_size: 'medium',
      rotation: Math.floor(Math.random() * 7) - 3,
    }));

    setMemories([...memories, ...newMemories]);
    e.target.value = '';
  };

  // Construct reactive Live Preview Gift object
  const previewGift: GiftType = {
    id: 'builder-preview',
    recipient_name: recipientName || 'Recipient',
    title: title || 'A Special Surprise',
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
    wishes,
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
          wishes,
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

  return (
    <div className="w-full pb-20">
      {/* Hidden file input for media uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-black/5">
        <div>
          <span className="text-xs font-semibold text-platform-violet uppercase tracking-wider">
            Creator Studio & Live Workspace
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-platform-dark font-normal">
            Gift Creation Builder
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Template Controls */}
          <button
            type="button"
            onClick={handleLoadDemoTemplate}
            className="px-3 py-2 rounded-xl border border-platform-violet/30 bg-purple-50 hover:bg-purple-100 text-platform-violet text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Pre-fill with complete demonstration draft"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Sample Template</span>
          </button>

          <button
            type="button"
            onClick={handleStartBlank}
            className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-stone-600 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Clear all fields and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Fresh</span>
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
              <span>
                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
              </span>
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

            {/* Quick Step Jump Tabs */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium text-platform-muted scrollbar-none">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i + 1)}
                  className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${
                    currentStep === i + 1
                      ? 'bg-platform-dark text-white font-semibold'
                      : 'hover:bg-black/5'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                        Event Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-white"
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
                        className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-white"
                      >
                      </input>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Custom URL Slug *
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-black/5 text-xs text-platform-muted border border-r-0 border-black/10 rounded-l-xl">
                        /g/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="w-full px-3 py-2.5 rounded-r-xl border border-black/10 text-xs focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
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
                    Watch the live preview panel update immediately as you select themes!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(THEME_PRESETS).map(([id, theme]) => {
                    const isSelected = selectedTheme === id;

                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedTheme(id as ThemeId)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-platform-violet bg-purple-50/50 shadow-md ring-2 ring-platform-violet/20'
                            : 'border-black/5 hover:border-black/20 bg-white'
                        }`}
                      >
                        <div
                          className={`w-full h-14 rounded-xl bg-gradient-to-r ${theme.previewGradient} shadow-inner mb-3 flex items-center justify-center`}
                        >
                          <span className="text-white text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                            {theme.badge}
                          </span>
                        </div>
                        <h4 className="font-serif text-sm font-semibold text-platform-dark">
                          {theme.name}
                        </h4>
                        <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
                          {theme.tagline}
                        </p>
                        {isSelected && (
                          <span className="text-platform-violet font-semibold text-xs mt-2 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Custom Theme Card */}
                  <div
                    onClick={() => setSelectedTheme('custom')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedTheme === 'custom'
                        ? 'border-platform-violet bg-purple-50/50 shadow-md ring-2 ring-platform-violet/20'
                        : 'border-black/5 hover:border-black/20 bg-white'
                    }`}
                  >
                    <div className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-inner mb-3 flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40">
                        ⚙ Custom Theme
                      </span>
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-platform-dark">
                      Custom Palette
                    </h4>
                    <p className="text-[11px] text-platform-muted mt-0.5">
                      Configure your own colors & typography.
                    </p>
                    {selectedTheme === 'custom' && (
                      <span className="text-platform-violet font-semibold text-xs mt-2 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom theme color pickers */}
                {selectedTheme === 'custom' && (
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/10 space-y-3">
                    <h5 className="text-xs font-semibold uppercase text-platform-dark">
                      Custom Palette Options
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] text-platform-muted mb-1">Primary</label>
                        <input
                          type="color"
                          value={customTheme.primaryColor}
                          onChange={(e) => setCustomTheme({ ...customTheme, primaryColor: e.target.value })}
                          className="w-full h-8 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-platform-muted mb-1">Background</label>
                        <input
                          type="color"
                          value={customTheme.backgroundColor}
                          onChange={(e) => setCustomTheme({ ...customTheme, backgroundColor: e.target.value })}
                          className="w-full h-8 rounded-lg cursor-pointer"
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
                    Configure the greeting greeting the recipient upon unlocking their surprise.
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
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Introduction Message
                    </label>
                    <textarea
                      rows={3}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={welcomeButtonText}
                      onChange={(e) => setWelcomeButtonText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
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
                    Step 4: Personal Letters & Words
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Compose heartfelt messages that display inside the gift.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Letter Heading
                    </label>
                    <input
                      type="text"
                      value={letters[0]?.heading || ''}
                      onChange={(e) =>
                        setLetters([{ ...letters[0], heading: e.target.value, content: letters[0]?.content || '', display_order: 1 }])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Letter Body
                    </label>
                    <textarea
                      rows={5}
                      value={letters[0]?.content || ''}
                      onChange={(e) =>
                        setLetters([{ ...letters[0], heading: letters[0]?.heading || '', content: e.target.value, display_order: 1 }])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs sm:text-sm font-light leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Farewell Closing Note
                    </label>
                    <textarea
                      rows={2}
                      value={closingMessage}
                      onChange={(e) => setClosingMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Media & Memory Wall / Gallery */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Step 5: Memory Wall & Photo Gallery
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Choose frame styles, sizes, and tilt angles. See them hang on the Memory Wall in the preview!
                  </p>
                </div>

                {/* Photo Experience Selector */}
                <div className="p-4 rounded-2xl bg-black/5 border border-black/10 space-y-2">
                  <label className="block text-xs font-semibold text-platform-dark">
                    Photo Experience Presentation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'both', label: 'Wall & Gallery', desc: 'Both decorative wall & grid' },
                      { id: 'auto', label: 'Memory Wall Only', desc: 'Hanging frames on wall' },
                      { id: 'manual', label: 'Gallery Grid Only', desc: 'Clean masonry album' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setWallLayoutMode(mode.id as WallLayoutMode)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          wallLayoutMode === mode.id
                            ? 'bg-platform-dark text-white border-platform-dark shadow-xs'
                            : 'bg-white border-black/10 text-platform-dark hover:bg-black/5'
                        }`}
                      >
                        <span className="text-xs font-medium block">{mode.label}</span>
                        <span className={`text-[10px] block ${wallLayoutMode === mode.id ? 'text-white/70' : 'text-platform-muted'}`}>
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-platform-dark text-white text-xs font-medium hover:bg-black transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photographs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMemories([
                        ...memories,
                        {
                          id: `m-${Date.now()}`,
                          image_path: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
                          caption: 'A new happy moment.',
                          memory_date: new Date().toISOString().split('T')[0],
                          display_order: memories.length + 1,
                          frame_style: 'polaroid',
                          frame_size: 'medium',
                          rotation: Math.floor(Math.random() * 6) - 3,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-black/10 text-xs font-medium text-platform-dark hover:bg-black/5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sample Photo</span>
                  </button>
                </div>

                {/* Photos List with Frame Controls */}
                <div className="space-y-4">
                  {memories.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="p-4 rounded-2xl bg-stone-50 border border-black/10 space-y-3"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={photo.image_path}
                          alt={photo.caption}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-black/10 bg-black/5"
                        />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={photo.caption}
                            onChange={(e) => {
                              const updated = [...memories];
                              updated[index].caption = e.target.value;
                              setMemories(updated);
                            }}
                            placeholder="Caption for this photograph..."
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={photo.memory_date || ''}
                              onChange={(e) => {
                                const updated = [...memories];
                                updated[index].memory_date = e.target.value;
                                setMemories(updated);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => setMemories(memories.filter((_, i) => i !== index))}
                              className="text-rose-600 hover:text-rose-800 text-xs p-1 ml-auto cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Frame Customization Controls */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 text-[11px]">
                        {/* Frame Style */}
                        <div>
                          <label className="block text-platform-muted mb-1 font-medium">
                            Frame Style
                          </label>
                          <select
                            value={photo.frame_style || 'polaroid'}
                            onChange={(e) => {
                              const updated = [...memories];
                              updated[index].frame_style = e.target.value as FrameStyle;
                              setMemories(updated);
                            }}
                            className="w-full px-2 py-1 rounded-md bg-white border border-black/10 text-[11px]"
                          >
                            <option value="polaroid">Polaroid</option>
                            <option value="vintage_wood">Vintage Wood</option>
                            <option value="golden_luxury">Golden Luxury</option>
                            <option value="scrapbook">Scrapbook</option>
                            <option value="pastel">Pastel</option>
                            <option value="minimal">Minimal</option>
                            <option value="theme_custom">Theme Colors</option>
                          </select>
                        </div>

                        {/* Frame Size */}
                        <div>
                          <label className="block text-platform-muted mb-1 font-medium">
                            Frame Size
                          </label>
                          <select
                            value={photo.frame_size || 'medium'}
                            onChange={(e) => {
                              const updated = [...memories];
                              updated[index].frame_size = e.target.value as FrameSize;
                              setMemories(updated);
                            }}
                            className="w-full px-2 py-1 rounded-md bg-white border border-black/10 text-[11px]"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>

                        {/* Tilt Angle */}
                        <div>
                          <label className="block text-platform-muted mb-1 font-medium">
                            Tilt Angle ({photo.rotation ?? 0}°)
                          </label>
                          <input
                            type="range"
                            min="-6"
                            max="6"
                            step="0.5"
                            value={photo.rotation ?? 0}
                            onChange={(e) => {
                              const updated = [...memories];
                              updated[index].rotation = parseFloat(e.target.value);
                              setMemories(updated);
                            }}
                            className="w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                    Enable or disable interactive modules. Any toggle immediately updates the live preview!
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'memory_wall', label: 'Memory Wall (Hanging Frames)', desc: 'Decorative wall with swinging photo frames' },
                    { id: 'memories', label: 'Memories Photo Gallery', desc: 'Classic responsive grid photo album' },
                    { id: 'gift_box', label: 'Virtual Gift Box Reveal', desc: 'Tap-to-unwrap box with confetti' },
                    { id: 'celebration', label: 'Birthday Cake & Candle Blowing', desc: 'Blowable candles with realistic flames' },
                    { id: 'timeline', label: 'Memory Timeline', desc: 'Chronological journey milestones' },
                    { id: 'quiz', label: 'Friendship Quiz', desc: 'Interactive trivia with score calculation' },
                    { id: 'scratch_card', label: 'Golden Scratch Card', desc: 'Scratch-to-reveal canvas card' },
                    { id: 'secret_messages', label: 'Secret Messages', desc: 'Tap-to-unseal confidential notes' },
                    { id: 'future_wishes', label: 'Future Wishes Carousel', desc: 'Step-by-step blessing cards' },
                    { id: 'letters', label: 'Personal Letter', desc: 'Heartfelt letterhead typography' },
                    { id: 'music', label: 'Music Player Bar', desc: 'Floating ambient audio player' },
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
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isEnabled
                            ? 'border-platform-violet/40 bg-purple-50/30'
                            : 'border-black/5 bg-black/5 opacity-60'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-platform-dark">
                            {feat.label}
                          </h4>
                          <p className="text-[11px] text-platform-muted">{feat.desc}</p>
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
                    Configure the content for the features you enabled.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/10">
                    <label className="block text-xs font-semibold text-platform-dark mb-1">
                      Scratch Card Hidden Message
                    </label>
                    <input
                      type="text"
                      value={scratchCardHiddenText}
                      onChange={(e) => setScratchCardHiddenText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 border border-black/10">
                    <label className="block text-xs font-semibold text-platform-dark mb-1">
                      Gift Box Surprise Note
                    </label>
                    <input
                      type="text"
                      value={giftBoxMessage}
                      onChange={(e) => setGiftBoxMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-black/5 border border-black/10 space-y-2">
                    <label className="block text-xs font-semibold text-platform-dark">
                      Secret Message Note
                    </label>
                    <input
                      type="text"
                      value={secretMessages[0]?.title || ''}
                      onChange={(e) =>
                        setSecretMessages([
                          { ...secretMessages[0], title: e.target.value, content: secretMessages[0]?.content || '', reveal_type: 'tap', display_order: 1 },
                        ])
                      }
                      placeholder="Whisper Title"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={secretMessages[0]?.content || ''}
                      onChange={(e) =>
                        setSecretMessages([
                          { ...secretMessages[0], title: secretMessages[0]?.title || '', content: e.target.value, reveal_type: 'tap', display_order: 1 },
                        ])
                      }
                      placeholder="Hidden secret message..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs"
                    />
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
                    Set a time-bound expiry and preview the farewell closing screen.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-black/10 bg-black/5">
                    <input
                      type="checkbox"
                      id="enableExpiry"
                      checked={expiryEnabled}
                      onChange={(e) => setExpiryEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-platform-violet cursor-pointer"
                    />
                    <label htmlFor="enableExpiry" className="text-xs font-medium text-platform-dark cursor-pointer">
                      Enable Gift Expiry Date & Time
                    </label>
                  </div>

                  {expiryEnabled && (
                    <div className="p-4 rounded-2xl bg-white border border-black/10 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-platform-muted mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-platform-muted mb-1">Time (UTC/IST)</label>
                          <input
                            type="time"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-platform-dark mb-1">
                          Post-Expiry Custom Message
                        </label>
                        <textarea
                          rows={2}
                          value={expiryMessage}
                          onChange={(e) => setExpiryMessage(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-xs"
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Gift Password *
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-dark mb-1.5">
                      Password Hint
                    </label>
                    <input
                      type="text"
                      value={passwordHint}
                      onChange={(e) => setPasswordHint(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: Preview & Publish */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-dark font-normal">
                    Step 10: Final Review & Publish
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Check the live preview on the right. Once satisfied, publish the gift to make its unique URL accessible!
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3">
                  <h4 className="font-serif text-base font-semibold text-purple-950">
                    Ready to deliver {recipientName}'s surprise?
                  </h4>
                  <p className="text-xs text-purple-900/80">
                    Your gift will be published at: <code>dearyou.com/g/{slug}</code>
                  </p>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full py-3 rounded-xl bg-platform-dark text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? 'Publishing...' : 'Confirm & Publish Gift'}
                  </button>
                </div>

                {publishError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {publishError}
                  </div>
                )}

                {isPublishedSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <span>Gift published successfully!</span>
                    <Link
                      href={`/g/${publishedSlug || slug}`}
                      target="_blank"
                      className="font-semibold underline flex items-center gap-1"
                    >
                      <span>Open Live Gift</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
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
                  <span>Continue</span>
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
          <LivePreviewPane gift={previewGift} />
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
              isMobileDrawer={true}
              onCloseMobilePreview={() => setShowMobilePreview(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
      return 'Memory Wall & Photos';
    case 6:
      return 'Feature Toggles';
    case 7:
      return 'Interactive Settings';
    case 8:
      return 'Gift Expiry';
    case 9:
      return 'Password & Access';
    case 10:
      return 'Review & Publish';
    default:
      return '';
  }
}
