'use client';

import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Palette,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Lock,
  Music,
  Share2,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Heart,
  Gift,
  HelpCircle,
  FileText,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { validateSlugFormat, normalizeSlug } from '@/lib/gifts/slug-rules';
import {
  DEFAULT_CONTENT_LIMITS,
  PlatformContentLimits,
  getUniquePhotos,
  countWords,
  clampToMaxWords,
} from '@/lib/config/content-limits';
import {
  WordLimitIndicator,
  LimitedInput,
  LimitedTextarea,
} from '@/components/admin/WordLimitIndicator';
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
  PasswordPageConfig,
  ExpiryPageConfig,
  MusicSource,
} from '@/types/gift';
import { ThemeId, CustomThemeConfig } from '@/types/theme';
import { THEME_PRESETS } from '@/config/themes';
import { LivePreviewPane, PreviewStateMode } from '@/components/admin/LivePreviewPane';
import { BackgroundMusicSelector } from '@/components/admin/BackgroundMusicSelector';
import { PlatformThemeToggle } from '@/components/common/PlatformThemeToggle';

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

function GiftBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams?.get('draftId') || searchParams?.get('edit') || null;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = WIZARD_PAGES.length;
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Draft persistence & autosave state
  const [draftId, setDraftId] = useState<string | null>(draftIdParam);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const editorScrollPosRef = useRef<number>(0);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Platform Content & Photo Limits state
  const [contentLimits, setContentLimits] = useState<PlatformContentLimits>(DEFAULT_CONTENT_LIMITS);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const replacingIndexRef = useRef<number | null>(null);
  const [photoUploadNotice, setPhotoUploadNotice] = useState<string | null>(null);

  // Fetch active platform content limits
  useEffect(() => {
    fetch('/api/developer/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.limits) {
          setContentLimits(data.limits);
        }
      })
      .catch((err) => console.warn('Could not load content limits for builder:', err));
  }, []);

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

  // Dedicated Per-Gift Background Music State
  const [musicSource, setMusicSource] = useState<MusicSource>('library');
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [libraryTrackId, setLibraryTrackId] = useState<string>('lib-gentle-moments');
  const [customAudioStoragePath, setCustomAudioStoragePath] = useState<string | undefined>();
  const [customAudioFilename, setCustomAudioFilename] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState<number | undefined>(184);
  const [playbackStartTime, setPlaybackStartTime] = useState<number>(0);
  const [playbackEndTime, setPlaybackEndTime] = useState<number | undefined>();
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [musicUrl, setMusicUrl] = useState<string | undefined>('/audio/gentle-moments.mp3');
  const [musicTitle, setMusicTitle] = useState<string | undefined>('Gentle Moments');
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [hasAudioUploadError, setHasAudioUploadError] = useState(false);

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

  // Top-Level Three-Experience Builder State
  const [activeExperience, setActiveExperience] = useState<'password_gate' | 'gift_journey' | 'expiry_screen'>('gift_journey');
  const [previewStateMode, setPreviewStateMode] = useState<PreviewStateMode>('unlocked');

  // Section A: Password Gate Editor State
  const [passwordHeadingPrefix, setPasswordHeadingPrefix] = useState('A surprise for');
  const [passwordCustomHeading, setPasswordCustomHeading] = useState('');
  const [passwordSubtitle, setPasswordSubtitle] = useState('');
  const [passwordInstructions, setPasswordInstructions] = useState('');
  const [passwordBadgeText, setPasswordBadgeText] = useState('Dear You Experience');
  const [passwordButtonText, setPasswordButtonText] = useState('Unlock Experience');
  const [passwordCardStyle, setPasswordCardStyle] = useState<'glass' | 'clean' | 'lavender' | 'minimal' | 'warm'>('glass');
  const [showBuilderPassword, setShowBuilderPassword] = useState(false);

  // Section C: Expiry / Closing Screen Editor State
  const [expiryThemeId, setExpiryThemeId] = useState<ThemeId>('dreamy');
  const [expiryShowHomeBtn, setExpiryShowHomeBtn] = useState(true);
  const [expiryHomeBtnText, setExpiryHomeBtnText] = useState('Return to Home');
  const [expiryShowCreateBtn, setExpiryShowCreateBtn] = useState(true);
  const [expiryCreateBtnText, setExpiryCreateBtnText] = useState('Create Your Own Gift');

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Slug Availability & Validation State
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved'>('idle');
  const [slugMessage, setSlugMessage] = useState<string>('');

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
    setMusicSource('library');
    setMusicEnabled(true);
    setLibraryTrackId('lib-gentle-moments');
    setCustomAudioStoragePath(undefined);
    setCustomAudioFilename(undefined);
    setAudioDuration(184);
    setPlaybackStartTime(0);
    setPlaybackEndTime(undefined);
    setLoopEnabled(true);
    setMusicUrl('/audio/gentle-moments.mp3');
    setMusicTitle('Gentle Moments');
    setIsAudioUploading(false);
    setHasAudioUploadError(false);
    setCurrentStep(1);
  };

  // Photo count and slot availability (unique across all sections)
  const uniquePhotos = getUniquePhotos({
    memories,
    timeline_entries: timelineEntries,
    cover_image: coverImage,
  });
  const maxPhotos = contentLimits?.maxPhotos || 15;
  const totalPhotosCount = uniquePhotos.length;
  const remainingPhotoSlots = Math.max(0, maxPhotos - totalPhotosCount);
  const isPhotoLimitReached = totalPhotosCount >= maxPhotos;

  // Upload handler for memories with 15-photo maximum enforcement
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (remainingPhotoSlots <= 0) {
      setPhotoUploadNotice(
        `Photo limit reached (${totalPhotosCount} / ${maxPhotos} photos used). Please remove or replace an existing photo to add new ones.`
      );
      e.target.value = '';
      return;
    }

    const fileList = Array.from(files);
    let filesToAccept = fileList;

    if (fileList.length > remainingPhotoSlots) {
      filesToAccept = fileList.slice(0, remainingPhotoSlots);
      setPhotoUploadNotice(
        `You selected ${fileList.length} photos, but only ${remainingPhotoSlots} slot(s) remain (maximum ${maxPhotos} photos). We added the first ${remainingPhotoSlots}. Please remove existing photos to add more.`
      );
    } else {
      setPhotoUploadNotice(null);
    }

    const newMemories: MemoryItem[] = filesToAccept.map((file, idx) => ({
      id: `mem-${Date.now()}-${idx}`,
      image_path: URL.createObjectURL(file),
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      memory_date: new Date().toISOString().split('T')[0],
      display_order: memories.length + idx + 1,
      frame_style: 'polaroid',
      frame_size: 'medium',
      rotation: idx % 2 === 0 ? -2.5 : 2.5,
    }));

    setMemories([...memories, ...newMemories]);
    e.target.value = '';
  };

  // Replace an existing photo in-place (does NOT consume an additional photo slot)
  const triggerReplacePhoto = (idx: number) => {
    replacingIndexRef.current = idx;
    replaceFileInputRef.current?.click();
  };

  const handleReplacePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const targetIdx = replacingIndexRef.current;
    if (!files || files.length === 0 || targetIdx === null || targetIdx === undefined) return;

    const file = files[0];
    const newUrl = URL.createObjectURL(file);
    const updated = [...memories];
    if (updated[targetIdx]) {
      updated[targetIdx] = {
        ...updated[targetIdx],
        image_path: newUrl,
      };
      setMemories(updated);
      setPhotoUploadNotice('Photo replaced successfully without consuming an extra slot.');
      setTimeout(() => setPhotoUploadNotice(null), 3500);
    }

    replacingIndexRef.current = null;
    e.target.value = '';
  };

  // Remove photo (frees up a slot)
  const handleRemovePhoto = (idx: number) => {
    setMemories(memories.filter((_, i) => i !== idx));
    setPhotoUploadNotice(null);
  };

  // Reorder photos
  const handleMovePhotoUp = (idx: number) => {
    if (idx <= 0) return;
    const updated = [...memories];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setMemories(updated);
  };

  const handleMovePhotoDown = (idx: number) => {
    if (idx >= memories.length - 1) return;
    const updated = [...memories];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setMemories(updated);
  };

  // Construct reactive Live Preview Gift object
  const passwordPageConfig: PasswordPageConfig = {
    heading_prefix: passwordHeadingPrefix,
    custom_heading: passwordCustomHeading,
    subtitle: passwordSubtitle,
    instructions: passwordInstructions,
    badge_text: passwordBadgeText,
    button_text: passwordButtonText,
    card_style: passwordCardStyle,
  };

  const expiryPageConfig: ExpiryPageConfig = {
    heading: expiryHeading,
    message: expiryMessage,
    theme_id: expiryThemeId,
    show_home_button: expiryShowHomeBtn,
    home_button_text: expiryHomeBtnText,
    show_create_button: expiryShowCreateBtn,
    create_button_text: expiryCreateBtnText,
  };

  const combinedThemeConfig: CustomThemeConfig = {
    ...customTheme,
    password_page: passwordPageConfig,
    expiry_page: expiryPageConfig,
  };

  const previewGift: GiftType = {
    id: 'builder-preview',
    recipient_name: recipientName || 'Recipient',
    title: title || 'A Special Surprise',
    slug: slug || 'surprise',
    event_type: eventType,
    event_date: eventDate,
    cover_image: coverImage || undefined,
    selected_theme: selectedTheme,
    theme_config: combinedThemeConfig,
    password_page_config: passwordPageConfig,
    expiry_page_config: expiryPageConfig,
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
    music_enabled: musicEnabled && musicSource !== 'none',
    music_source: musicSource,
    library_track_id: libraryTrackId,
    custom_audio_storage_path: customAudioStoragePath,
    custom_audio_filename: customAudioFilename,
    audio_duration: audioDuration,
    playback_start_time: playbackStartTime,
    playback_end_time: playbackEndTime,
    loop_enabled: loopEnabled,
    music_url: musicEnabled && musicSource !== 'none' ? musicUrl : undefined,
    music_title: musicEnabled && musicSource !== 'none' ? musicTitle : undefined,
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

  // Load existing draft if draftIdParam is present
  useEffect(() => {
    if (!draftIdParam) {
      isInitialLoadRef.current = false;
      return;
    }

    async function loadExistingDraft() {
      try {
        const res = await fetch(`/api/gifts?id=${draftIdParam}`);
        if (res.ok) {
          const data = await res.json();
          const g: GiftType = data.gift;
          if (g) {
            setRecipientName(g.recipient_name || '');
            setTitle(g.title || '');
            setSlug(g.slug || '');
            setEventType(g.event_type || 'Birthday');
            if (g.event_date) setEventDate(g.event_date);
            setIntroduction(g.introduction || '');
            setCoverImage(g.cover_image || '');
            setWelcomeHeading(g.welcome_heading || '');
            setWelcomeMessage(g.welcome_message || '');
            setWelcomeButtonText(g.welcome_button_text || 'Start Your Journey');
            setSelectedTheme(g.selected_theme || 'dreamy');
            if (g.theme_config) setCustomTheme(g.theme_config);
            setGiftBoxMessage(g.gift_box_message || '');
            setScratchCardHiddenText(g.scratch_card_hidden_text || '');
            if (g.memories && g.memories.length > 0) setMemories(g.memories);
            if (g.timeline_entries && g.timeline_entries.length > 0) setTimelineEntries(g.timeline_entries);
            if (g.quiz_questions && g.quiz_questions.length > 0) setQuizQuestions(g.quiz_questions);
            if (g.secret_messages && g.secret_messages.length > 0) setSecretMessages(g.secret_messages);
            if (g.letters && g.letters.length > 0) setLetters(g.letters);
            if (g.wishes && g.wishes.length > 0) setWishes(g.wishes.map((w: any) => w.wish_text));
            setClosingMessage(g.closing_message || '');
            setPasswordHint(g.password_hint || '');
            setExpiryEnabled(!!g.expiry_enabled);
            if (g.expires_at) {
              setExpiryDate(g.expires_at.split('T')[0]);
              setExpiryTime(g.expires_at.split('T')[1]?.slice(0, 5) || '23:59');
            }
            if (g.expiry_timezone) setExpiryTimezone(g.expiry_timezone);
            setExpiryHeading(g.expiry_heading || '');
            setExpiryMessage(g.expiry_message || '');

            const pwCfg = g.theme_config?.password_page || (g as any).password_page_config;
            if (pwCfg) {
              if (pwCfg.heading_prefix !== undefined) setPasswordHeadingPrefix(pwCfg.heading_prefix);
              if (pwCfg.custom_heading !== undefined) setPasswordCustomHeading(pwCfg.custom_heading);
              if (pwCfg.subtitle !== undefined) setPasswordSubtitle(pwCfg.subtitle);
              if (pwCfg.instructions !== undefined) setPasswordInstructions(pwCfg.instructions);
              if (pwCfg.badge_text !== undefined) setPasswordBadgeText(pwCfg.badge_text);
              if (pwCfg.button_text !== undefined) setPasswordButtonText(pwCfg.button_text);
              if (pwCfg.card_style !== undefined) setPasswordCardStyle(pwCfg.card_style);
            }

            const expCfg = g.theme_config?.expiry_page || (g as any).expiry_page_config;
            if (expCfg) {
              if (expCfg.heading !== undefined) setExpiryHeading(expCfg.heading);
              if (expCfg.message !== undefined) setExpiryMessage(expCfg.message);
              if (expCfg.theme_id !== undefined) setExpiryThemeId(expCfg.theme_id);
              if (expCfg.show_home_button !== undefined) setExpiryShowHomeBtn(expCfg.show_home_button);
              if (expCfg.home_button_text !== undefined) setExpiryHomeBtnText(expCfg.home_button_text);
              if (expCfg.show_create_button !== undefined) setExpiryShowCreateBtn(expCfg.show_create_button);
              if (expCfg.create_button_text !== undefined) setExpiryCreateBtnText(expCfg.create_button_text);
            }

            // Restore Personalized Background Music
            if (g.music_source !== undefined) setMusicSource(g.music_source);
            else if (g.music_url) setMusicSource('library');
            else if (g.music_enabled === false) setMusicSource('none');

            if (g.music_enabled !== undefined) setMusicEnabled(g.music_enabled);
            else if (g.music_url) setMusicEnabled(true);

            if (g.library_track_id) setLibraryTrackId(g.library_track_id);
            if (g.custom_audio_storage_path) setCustomAudioStoragePath(g.custom_audio_storage_path);
            if (g.custom_audio_filename) setCustomAudioFilename(g.custom_audio_filename);
            if (g.audio_duration !== undefined) setAudioDuration(g.audio_duration);
            if (g.playback_start_time !== undefined) setPlaybackStartTime(g.playback_start_time);
            if (g.playback_end_time !== undefined) setPlaybackEndTime(g.playback_end_time);
            if (g.loop_enabled !== undefined) setLoopEnabled(g.loop_enabled);
            if (g.music_url) setMusicUrl(g.music_url);
            if (g.music_title) setMusicTitle(g.music_title);

            setDraftId(g.id);
            setSaveStatus('saved');
          }
        }
      } catch (err) {
        console.warn('Failed to load existing draft:', err);
      } finally {
        isInitialLoadRef.current = false;
      }
    }

    loadExistingDraft();
  }, [draftIdParam]);

  // Robust Server-Side Draft Save Function
  const saveDraft = useCallback(
    async (customStatus: 'draft' | 'published' = 'draft') => {
      setSaveStatus('saving');
      try {
        const currentPasswordPageConfig: PasswordPageConfig = {
          heading_prefix: passwordHeadingPrefix,
          custom_heading: passwordCustomHeading,
          subtitle: passwordSubtitle,
          instructions: passwordInstructions,
          badge_text: passwordBadgeText,
          button_text: passwordButtonText,
          card_style: passwordCardStyle,
        };

        const currentExpiryPageConfig: ExpiryPageConfig = {
          heading: expiryHeading,
          message: expiryMessage,
          theme_id: expiryThemeId,
          show_home_button: expiryShowHomeBtn,
          home_button_text: expiryHomeBtnText,
          show_create_button: expiryShowCreateBtn,
          create_button_text: expiryCreateBtnText,
        };

        const currentCombinedThemeConfig: CustomThemeConfig = {
          ...customTheme,
          password_page: currentPasswordPageConfig,
          expiry_page: currentExpiryPageConfig,
        };

        const payload = {
          draft_id: draftId,
          recipient_name: recipientName,
          title,
          slug,
          event_type: eventType,
          event_date: eventDate,
          cover_image: coverImage || undefined,
          selected_theme: selectedTheme,
          theme_config: currentCombinedThemeConfig,
          password_page_config: currentPasswordPageConfig,
          expiry_page_config: currentExpiryPageConfig,
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
          music_enabled: musicEnabled && musicSource !== 'none',
          music_source: musicSource,
          library_track_id: libraryTrackId,
          custom_audio_storage_path: customAudioStoragePath,
          custom_audio_filename: customAudioFilename,
          audio_duration: audioDuration,
          playback_start_time: playbackStartTime,
          playback_end_time: playbackEndTime,
          loop_enabled: loopEnabled,
          music_url: musicEnabled && musicSource !== 'none' ? musicUrl : undefined,
          music_title: musicEnabled && musicSource !== 'none' ? musicTitle : undefined,
          memory_wall_config: { layout_mode: wallLayoutMode, enable_hanging_effect: true },
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
          status: customStatus,
        };

        // Emergency local snapshot backup
        try {
          localStorage.setItem('dearyou_draft_recovery', JSON.stringify(payload));
        } catch {}

        const res = await fetch('/api/gifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (data.draft_id) setDraftId(data.draft_id);
          setSaveStatus('saved');
          setLastSavedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
          return { success: true, data };
        } else {
          setSaveStatus('error');
          return { success: false, error: data.error };
        }
      } catch (err: any) {
        setSaveStatus('error');
        return { success: false, error: err.message };
      }
    },
    [
      draftId,
      recipientName,
      title,
      slug,
      eventType,
      eventDate,
      coverImage,
      selectedTheme,
      customTheme,
      introduction,
      welcomeHeading,
      welcomeMessage,
      welcomeButtonText,
      giftBoxMessage,
      scratchCardHiddenText,
      closingMessage,
      password,
      passwordHint,
      expiryEnabled,
      expiryDate,
      expiryTime,
      expiryTimezone,
      expiryHeading,
      expiryMessage,
      enabledFeatures,
      wallLayoutMode,
      memories,
      timelineEntries,
      quizQuestions,
      secretMessages,
      letters,
      wishes,
      passwordHeadingPrefix,
      passwordCustomHeading,
      passwordSubtitle,
      passwordInstructions,
      passwordBadgeText,
      passwordButtonText,
      passwordCardStyle,
      expiryThemeId,
      expiryShowHomeBtn,
      expiryHomeBtnText,
      expiryShowCreateBtn,
      expiryCreateBtnText,
      musicEnabled,
      musicSource,
      libraryTrackId,
      customAudioStoragePath,
      customAudioFilename,
      audioDuration,
      playbackStartTime,
      playbackEndTime,
      loopEnabled,
      musicUrl,
      musicTitle,
    ]
  );

  // Debounced Autosave (1200ms) on user edits
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    setSaveStatus('unsaved');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveDraft('draft');
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    recipientName,
    title,
    slug,
    eventType,
    eventDate,
    coverImage,
    selectedTheme,
    customTheme,
    introduction,
    welcomeHeading,
    welcomeMessage,
    welcomeButtonText,
    giftBoxMessage,
    scratchCardHiddenText,
    closingMessage,
    passwordHint,
    expiryEnabled,
    expiryDate,
    expiryTime,
    memories,
    timelineEntries,
    quizQuestions,
    secretMessages,
    letters,
    wishes,
    enabledFeatures,
    musicEnabled,
    musicSource,
    libraryTrackId,
    customAudioStoragePath,
    customAudioFilename,
    audioDuration,
    playbackStartTime,
    playbackEndTime,
    loopEnabled,
    musicUrl,
    musicTitle,
    saveDraft,
  ]);

  // Real-time debounced slug availability checking
  useEffect(() => {
    if (!slug) {
      setSlugStatus('invalid');
      setSlugMessage('Please enter a URL slug.');
      return;
    }

    const validation = validateSlugFormat(slug);
    if (!validation.valid) {
      if (validation.error?.includes('reserved')) {
        setSlugStatus('reserved');
      } else {
        setSlugStatus('invalid');
      }
      setSlugMessage(validation.error || 'Invalid URL slug format.');
      return;
    }

    setSlugStatus('checking');
    setSlugMessage('Checking URL availability...');

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          slug: validation.normalized,
          ...(draftId ? { currentGiftId: draftId } : {}),
        });

        const res = await fetch(`/api/gifts/check-slug?${queryParams.toString()}`);
        const data = await res.json();

        if (data.available) {
          setSlugStatus('available');
          setSlugMessage(data.isCurrentGift ? '✓ Current URL for this gift' : '✓ This URL is available!');
        } else {
          if (data.reason?.includes('reserved')) {
            setSlugStatus('reserved');
          } else {
            setSlugStatus('taken');
          }
          setSlugMessage(data.reason || '✕ This URL is already taken. Please choose another one.');
        }
      } catch {
        setSlugStatus('idle');
        setSlugMessage('');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, draftId]);

  const handlePublish = async () => {
    if (!recipientName.trim() || !title.trim() || !password.trim()) {
      setPublishError('Please ensure Recipient Name, Card Title, and Password are provided.');
      return;
    }

    const validation = validateSlugFormat(slug);
    if (!validation.valid) {
      setPublishError(validation.error || 'Please enter a valid URL slug.');
      return;
    }

    if (slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid') {
      setPublishError(slugMessage || 'Please choose an available URL slug before publishing.');
      return;
    }

    if (slugStatus === 'checking') {
      setPublishError('Please wait a moment while we verify URL slug availability.');
      return;
    }

    if (isAudioUploading) {
      setPublishError('Please wait for the audio upload to complete before publishing.');
      return;
    }

    if (hasAudioUploadError) {
      setPublishError('The uploaded audio file could not be processed. Please re-upload or select a library song before publishing.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const res = await saveDraft('published');
      if (!res.success) {
        setPublishError(res.error || 'Failed to publish card.');
      } else {
        setPublishedSlug(res.data.gift.slug);
        setIsPublishedSuccess(true);
      }
    } catch {
      setPublishError('Network error while publishing gift.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderSlugInputSection = () => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-platform-text">
          Custom URL Slug *
        </label>
        <span className="text-[10px] text-platform-muted">
          Unique recipient link
        </span>
      </div>

      <div className="relative flex items-center rounded-xl border border-platform-inputBorder bg-platform-inputBg overflow-hidden focus-within:border-platform-violet focus-within:ring-2 focus-within:ring-platform-violet/30 transition-all">
        <span className="pl-3.5 pr-1 text-xs font-mono font-medium text-platform-muted select-none">
          /g/
        </span>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            const raw = e.target.value
              .toLowerCase()
              .replace(/[\s_]+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
              .replace(/-+/g, '-');
            setSlug(raw);
            if (publishError) setPublishError(null);
          }}
          onBlur={() => {
            setSlug((prev) => normalizeSlug(prev));
          }}
          placeholder="e.g. ananya-birthday"
          className="flex-1 py-3 pr-10 bg-transparent text-xs sm:text-sm font-mono font-medium text-platform-text focus:outline-none"
        />
        <div className="absolute right-3 flex items-center pointer-events-none">
          {slugStatus === 'checking' && (
            <Loader2 className="w-4 h-4 text-platform-violet animate-spin" />
          )}
          {slugStatus === 'available' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          {(slugStatus === 'taken' || slugStatus === 'reserved') && (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          {slugStatus === 'invalid' && (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </div>

      {/* Live Availability Status Message */}
      {slugStatus === 'checking' && (
        <p className="text-xs text-platform-violet flex items-center gap-1.5 font-medium mt-1">
          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
          <span>Checking URL availability...</span>
        </p>
      )}
      {slugStatus === 'available' && (
        <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{slugMessage}</span>
        </p>
      )}
      {slugStatus === 'taken' && (
        <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{slugMessage}</span>
        </p>
      )}
      {slugStatus === 'reserved' && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{slugMessage}</span>
        </p>
      )}
      {slugStatus === 'invalid' && (
        <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{slugMessage}</span>
        </p>
      )}

      {/* Full Live Gift Link Preview */}
      <div className="p-2.5 rounded-xl bg-platform-cardSubtle border border-platform-border text-[11px] font-mono text-platform-muted break-all flex items-center gap-1.5">
        <span className="text-platform-muted shrink-0 font-sans font-medium">Recipient URL:</span>
        <span className="text-platform-text font-medium font-mono">
          https://dear-you-wine.vercel.app/g/{slug || '...'}
        </span>
      </div>
    </div>
  );

  const activePageConfig = WIZARD_PAGES[currentStep - 1];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-platform-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-platform-text tracking-tight">
              Gift Creator Studio
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
              Live Synchronised
            </span>
          </div>
          <p className="text-xs sm:text-sm text-platform-muted mt-1">
            Build your gift page by page. The preview on the right navigates automatically to match your active section.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Desktop Save Status Indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-platform-cardSubtle border border-platform-border text-platform-muted">
            {saveStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-800 dark:text-amber-300 font-medium">Saving draft...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                  Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                </span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span className="text-stone-600 dark:text-stone-400">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'error' && (
              <button
                type="button"
                onClick={() => saveDraft('draft')}
                className="text-rose-600 dark:text-rose-400 font-medium underline cursor-pointer"
              >
                Save failed — Retry
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartFresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-platform-border text-xs font-medium text-platform-muted hover:text-platform-text hover:bg-platform-hover transition-colors cursor-pointer"
            title="Clear all prefilled content and start with a blank card"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh</span>
          </button>

          {/* Desktop Manual Save Draft Button */}
          <button
            type="button"
            onClick={() => saveDraft('draft')}
            disabled={saveStatus === 'saving'}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-platform-border text-xs font-medium text-platform-text hover:bg-platform-hover transition-colors cursor-pointer"
          >
            <span>Save Draft</span>
          </button>

          <PlatformThemeToggle variant="compact" />

          {/* Mobile Preview Trigger Button (Header) */}
          <button
            onClick={() => {
              editorScrollPosRef.current = window.scrollY;
              setShowMobilePreview(true);
            }}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-platform-violet text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>

          <Link
            href="/admin/gifts"
            className="px-3.5 py-2 rounded-xl border border-platform-border text-xs font-medium text-platform-text hover:bg-platform-hover transition-colors"
          >
            Exit
          </Link>
        </div>
      </div>

      {/* Two-Panel Workspace on Desktop / Single Column on Mobile */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* ======================================================== */}
        {/* LEFT PANEL: CREATOR EDITOR (45% width on desktop)        */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[45%] xl:w-[42%] space-y-6 pb-28 sm:pb-32 lg:pb-8">
          {/* Top-Level Experience Selector: 3 Dedicated Pages */}
          <div className="bg-platform-card p-2.5 sm:p-3 rounded-2xl border border-platform-border shadow-xs">
            <div className="text-[11px] font-semibold text-platform-muted uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Gift Experience</span>
              <span className="text-[10px] text-platform-violet font-normal">3 dedicated pages</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveExperience('password_gate');
                  setPreviewStateMode('password_gate');
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeExperience === 'password_gate'
                    ? 'bg-platform-btnBg text-platform-btnText shadow-sm font-semibold'
                    : 'bg-platform-cardSubtle hover:bg-platform-hover text-platform-text'
                }`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Password Gate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveExperience('gift_journey');
                  setPreviewStateMode('unlocked');
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeExperience === 'gift_journey'
                    ? 'bg-platform-btnBg text-platform-btnText shadow-sm font-semibold'
                    : 'bg-platform-cardSubtle hover:bg-platform-hover text-platform-text'
                }`}
              >
                <Gift className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Gift Journey</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveExperience('expiry_screen');
                  setPreviewStateMode('expired_closing');
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeExperience === 'expiry_screen'
                    ? 'bg-platform-btnBg text-platform-btnText shadow-sm font-semibold'
                    : 'bg-platform-cardSubtle hover:bg-platform-hover text-platform-text'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Expiry Screen</span>
              </button>
            </div>
          </div>

          {/* SECTION A: Password Gate Editor */}
          {activeExperience === 'password_gate' && (
            <div className="bg-platform-card p-6 sm:p-8 rounded-3xl border border-platform-border shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-platform-border pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-platform-violet uppercase tracking-wider">
                    Section A • First Screen Recipients See
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Password Gate Editor
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Customise the opening heading prefix, recipient name, card appearance, instructions and access security.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-platform-violet/10 border border-platform-violet/20 flex items-center justify-center text-platform-violet shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              {/* Live Computed Heading Preview */}
              <div className="p-4 rounded-2xl bg-platform-light border border-black/5">
                <span className="text-[10px] uppercase font-semibold text-platform-muted block mb-1">
                  Live Recipient Heading Preview
                </span>
                <div className="font-serif text-lg sm:text-xl text-platform-text">
                  {passwordCustomHeading && passwordCustomHeading.trim().length > 0
                    ? passwordCustomHeading
                    : `${passwordHeadingPrefix || 'A surprise for'} ${recipientName || 'Someone Special'}`}
                </div>
              </div>

              <div className="space-y-4">
                {/* Heading Prefix (The fix for "A surprise for"!) */}
                <div>
                  <label className="block text-xs font-semibold text-platform-text mb-1.5">
                    Heading Prefix * (Editable Prefix)
                  </label>
                  <input
                    type="text"
                    value={passwordHeadingPrefix}
                    onChange={(e) => setPasswordHeadingPrefix(e.target.value)}
                    placeholder="e.g. A surprise for, A little secret for, Specially crafted for"
                    className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'A surprise for',
                      'A little secret for',
                      'Something special for',
                      'Crafted with love for',
                      'A digital keepsake for',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPasswordHeadingPrefix(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-platform-text transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-xs font-semibold text-platform-text mb-1.5">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Ananya, Rahul, Maya"
                    className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                  />
                </div>

                {/* Custom Full Heading Override (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-platform-text mb-1.5 flex items-center justify-between">
                    <span>Custom Full Heading (Optional Override)</span>
                    <span className="text-[10px] text-platform-muted font-normal">Replaces Prefix + Name</span>
                  </label>
                  <input
                    type="text"
                    value={passwordCustomHeading}
                    onChange={(e) => setPasswordCustomHeading(e.target.value)}
                    placeholder="e.g. Something special for someone special"
                    className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                  />
                  <p className="text-[11px] text-platform-muted mt-1">
                    Leave blank to use &ldquo;{passwordHeadingPrefix || 'A surprise for'} {recipientName || 'Someone Special'}&rdquo;.
                  </p>
                </div>

                {/* Subtitle */}
                <div>
                  <LimitedInput
                    label="Subtitle / Description"
                    value={passwordSubtitle}
                    onChange={(val) => setPasswordSubtitle(val)}
                    maxWords={25}
                    placeholder="e.g. Someone special created a personal digital keepsake for you."
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-platform-text mb-1.5">
                    Password Instructions (Optional Hint/Clue Prompt)
                  </label>
                  <input
                    type="text"
                    value={passwordInstructions}
                    onChange={(e) => setPasswordInstructions(e.target.value)}
                    placeholder="e.g. Enter the secret passcode shared with you"
                    className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                  />
                </div>

                {/* Badge Text & Button Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Decorative Badge Text
                    </label>
                    <input
                      type="text"
                      value={passwordBadgeText}
                      onChange={(e) => setPasswordBadgeText(e.target.value)}
                      placeholder="Dear You Experience"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Unlock Button Label
                    </label>
                    <input
                      type="text"
                      value={passwordButtonText}
                      onChange={(e) => setPasswordButtonText(e.target.value)}
                      placeholder="Unlock Experience"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>
                </div>

                {/* Card Style Appearance */}
                <div>
                  <label className="block text-xs font-semibold text-platform-text mb-1.5">
                    Card Container Appearance
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'glass', label: 'Frosted Glass', desc: 'Modern blur & accent glow' },
                      { id: 'clean', label: 'Clean Ivory', desc: 'Crisp bordered card' },
                      { id: 'lavender', label: 'Lavender Dream', desc: 'Soft romantic gradient' },
                      { id: 'minimal', label: 'Minimalist', desc: 'Ultra-light frame' },
                      { id: 'warm', label: 'Warm Glow', desc: 'Golden amber undertone' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setPasswordCardStyle(style.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          passwordCardStyle === style.id
                            ? 'border-platform-violet bg-platform-violet/5 ring-1 ring-platform-violet'
                            : 'border-black/10 hover:border-black/20 bg-stone-50/50'
                        }`}
                      >
                        <div className="text-xs font-semibold text-platform-text">{style.label}</div>
                        <div className="text-[10px] text-platform-muted mt-0.5 leading-snug">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password & Security Configuration */}
                <div className="pt-4 border-t border-black/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-platform-text" />
                    <h3 className="text-xs font-semibold text-platform-text uppercase tracking-wider">
                      URL & Access Security Settings
                    </h3>
                  </div>

                  {renderSlugInputSection()}

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Secret Access Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showBuilderPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set gift password"
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-black/10 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBuilderPassword(!showBuilderPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-platform-muted hover:text-platform-text p-1"
                        aria-label={showBuilderPassword ? 'Hide password' : 'Show password'}
                      >
                        {showBuilderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Password Hint (Optional)
                    </label>
                    <input
                      type="text"
                      value={passwordHint}
                      onChange={(e) => setPasswordHint(e.target.value)}
                      placeholder="e.g. Our favourite rooftop cafe, The year we met"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 text-[11px] text-platform-muted leading-relaxed">
                    🔒 <strong>Security Guarantee:</strong> Passwords are cryptographically salted and hashed using bcrypt before storage. Plaintext passwords are never saved in draft JSON or exposed in public previews.
                  </div>
                </div>
              </div>

              {/* Navigation to next experience */}
              <div className="pt-4 border-t border-platform-border flex items-center justify-between">
                <span className="text-xs text-platform-muted">Autosaved to draft</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveExperience('gift_journey');
                    setPreviewStateMode('unlocked');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-xs cursor-pointer"
                >
                  <span>Continue to Gift Journey</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION B: Gift Journey Wizard (Pages 1 to 6) */}
          {activeExperience === 'gift_journey' && (
            <>
              {/* Step Progress Bar */}
              <div className="bg-platform-card p-4 sm:p-5 rounded-2xl border border-platform-border shadow-xs">
            <div className="flex items-center justify-between text-xs text-platform-muted mb-3 font-medium">
              <span className="font-semibold text-platform-text">
                {activePageConfig.label}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-platform-violet"
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
                      ? 'bg-platform-btnBg text-platform-btnText font-semibold shadow-xs'
                      : 'hover:bg-platform-hover text-platform-text'
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
          <div className="bg-platform-card p-6 sm:p-8 rounded-3xl border border-platform-border shadow-xs">
            {/* PAGE 1: Cover & Welcome */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 1: Cover, Welcome & Visual Theme
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Set up who this gift is for, the opening cover atmosphere, and choose its bespoke theme palette.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Maya, Ananya, Kabir"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Gift Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.cardTitle.maxWords;
                        if (
                          contentLimits.fields.cardTitle.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(title)
                        ) {
                          return;
                        }
                        setTitle(nextVal);
                      }}
                      placeholder="e.g. A Little Universe for Maya"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={title}
                      maxWords={contentLimits.fields.cardTitle.maxWords}
                      enabled={contentLimits.fields.cardTitle.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Short Introduction (Optional)
                    </label>
                    <input
                      type="text"
                      value={introduction}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.shortIntroduction.maxWords;
                        if (
                          contentLimits.fields.shortIntroduction.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(introduction)
                        ) {
                          return;
                        }
                        setIntroduction(nextVal);
                      }}
                      placeholder="e.g. A little universe crafted just for you."
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={introduction}
                      maxWords={contentLimits.fields.shortIntroduction.maxWords}
                      enabled={contentLimits.fields.shortIntroduction.enabled}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-platform-text mb-1.5">
                        Occasion Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
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
                      <label className="block text-xs font-semibold text-platform-text mb-1.5">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                      >
                      </input>
                    </div>
                  </div>

                  {/* Welcome Greeting */}
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Welcome Heading
                    </label>
                    <input
                      type="text"
                      value={welcomeHeading}
                      onChange={(e) => setWelcomeHeading(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Welcome Message
                    </label>
                    <textarea
                      rows={3}
                      value={welcomeMessage}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.welcomeMessage.maxWords;
                        if (
                          contentLimits.fields.welcomeMessage.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(welcomeMessage)
                        ) {
                          return;
                        }
                        setWelcomeMessage(nextVal);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={welcomeMessage}
                      maxWords={contentLimits.fields.welcomeMessage.maxWords}
                      enabled={contentLimits.fields.welcomeMessage.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Cover Button Text
                    </label>
                    <input
                      type="text"
                      value={welcomeButtonText}
                      onChange={(e) => setWelcomeButtonText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  {/* Visual Theme Selection */}
                  <div className="pt-4 border-t border-black/5">
                    <label className="block text-xs font-semibold text-platform-text mb-3 flex items-center gap-1.5">
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
                              <span className="font-serif text-xs font-medium text-platform-text block truncate">
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
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 2: Surprise Gift Reveal
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    When the recipient taps the wrapped gift box, it unties to reveal this hidden message.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Gift Box Secret Message *
                    </label>
                    <textarea
                      rows={4}
                      value={giftBoxMessage}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.specialMessage.maxWords;
                        if (
                          contentLimits.fields.specialMessage.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(giftBoxMessage)
                        ) {
                          return;
                        }
                        setGiftBoxMessage(nextVal);
                      }}
                      placeholder="Write the heartfelt revelation that appears when the gift unties..."
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={giftBoxMessage}
                      maxWords={contentLimits.fields.specialMessage.maxWords}
                      enabled={contentLimits.fields.specialMessage.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Scratch Card Hidden Note
                    </label>
                    <input
                      type="text"
                      value={scratchCardHiddenText}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.specialMessage.maxWords;
                        if (
                          contentLimits.fields.specialMessage.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(scratchCardHiddenText)
                        ) {
                          return;
                        }
                        setScratchCardHiddenText(nextVal);
                      }}
                      placeholder="Hidden until recipient scratches with cursor or fingertip..."
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={scratchCardHiddenText}
                      maxWords={contentLimits.fields.specialMessage.maxWords}
                      enabled={contentLimits.fields.specialMessage.enabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: The Memory Wall */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 3: The Memory Wall & Photographs
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Upload photographs into physical hanging frames with customizable tilt angles, frame styles, and captions.
                  </p>
                </div>

                {/* Combined Photo Quota & Available Slots */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-platform-violet" />
                      <span className="text-xs font-semibold text-platform-text">
                        Photos: {totalPhotosCount} / {maxPhotos} used
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-medium ${
                        remainingPhotoSlots === 0
                          ? 'text-rose-600 font-semibold'
                          : 'text-platform-muted'
                      }`}
                    >
                      {remainingPhotoSlots === 0
                        ? 'Limit reached (0 slots remaining)'
                        : `${remainingPhotoSlots} photo slots remaining`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isPhotoLimitReached ? 'bg-rose-500' : 'bg-platform-violet'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((totalPhotosCount / maxPhotos) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  {photoUploadNotice && (
                    <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>{photoUploadNotice}</span>
                    </div>
                  )}
                </div>

                {/* Upload & Replace Triggers */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    disabled={isPhotoLimitReached}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    accept="image/*"
                    onChange={handleReplacePhoto}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isPhotoLimitReached}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-4 px-6 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 group ${
                      isPhotoLimitReached
                        ? 'border-stone-200 bg-stone-50 cursor-not-allowed opacity-60'
                        : 'border-purple-200 hover:border-platform-violet bg-purple-50/50 hover:bg-purple-50 cursor-pointer'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-platform-violet/10 text-platform-violet flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-platform-text">
                      {isPhotoLimitReached
                        ? 'Maximum Photo Limit Reached (15 Photos)'
                        : 'Upload Photos for the Memory Wall'}
                    </span>
                    <span className="text-[11px] text-platform-muted">
                      {isPhotoLimitReached
                        ? 'Remove or replace an existing photo to upload new ones'
                        : `${remainingPhotoSlots} available slots • JPG, PNG, WebP up to 10MB each`}
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
                              const nextVal = e.target.value;
                              const max = contentLimits.fields.memoryCaption.maxWords;
                              if (
                                contentLimits.fields.memoryCaption.enabled &&
                                countWords(nextVal) > max &&
                                countWords(nextVal) > countWords(photo.caption || '')
                              ) {
                                return;
                              }
                              const updated = [...memories];
                              updated[idx].caption = nextVal;
                              setMemories(updated);
                            }}
                            placeholder="Write a caption for this memory..."
                            className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-xs focus:outline-none"
                          />
                          <WordLimitIndicator
                            text={photo.caption}
                            maxWords={contentLimits.fields.memoryCaption.maxWords}
                            enabled={contentLimits.fields.memoryCaption.enabled}
                            showFeedbackText={false}
                          />

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <select
                              value={photo.frame_style || 'polaroid'}
                              onChange={(e) => {
                                const updated = [...memories];
                                updated[idx].frame_style = e.target.value as FrameStyle;
                                setMemories(updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-platform-inputBorder bg-platform-inputBg text-platform-text"
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
                              className="px-2.5 py-1.5 rounded-lg border border-platform-inputBorder bg-platform-inputBg text-platform-text"
                            />
                          </div>
                        </div>

                        {/* Actions: Reorder, Replace, Delete */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerReplacePhoto(idx)}
                            title="Replace photograph (retains slot)"
                            className="p-1.5 text-stone-500 hover:text-platform-violet hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePhotoUp(idx)}
                            title="Move photo up"
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === memories.length - 1}
                            onClick={() => handleMovePhotoDown(idx)}
                            title="Move photo down"
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo (frees slot)"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 4: Interactive Celebrations & Milestones
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Configure interactive modules: birthday candle blowing, timeline milestones, and background music.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Dedicated Per-Gift Background Music Selector */}
                  <BackgroundMusicSelector
                    giftId={draftId || undefined}
                    musicSource={musicSource}
                    musicEnabled={musicEnabled}
                    libraryTrackId={libraryTrackId}
                    customAudioStoragePath={customAudioStoragePath}
                    customAudioFilename={customAudioFilename}
                    audioDuration={audioDuration}
                    playbackStartTime={playbackStartTime}
                    playbackEndTime={playbackEndTime}
                    loopEnabled={loopEnabled}
                    musicUrl={musicUrl}
                    musicTitle={musicTitle}
                    onChange={(config) => {
                      setMusicEnabled(config.music_enabled);
                      setMusicSource(config.music_source);
                      setLibraryTrackId(config.library_track_id || 'lib-gentle-moments');
                      setCustomAudioStoragePath(config.custom_audio_storage_path);
                      setCustomAudioFilename(config.custom_audio_filename);
                      setAudioDuration(config.audio_duration);
                      setPlaybackStartTime(config.playback_start_time ?? 0);
                      setPlaybackEndTime(config.playback_end_time);
                      setLoopEnabled(config.loop_enabled);
                      setMusicUrl(config.music_url);
                      setMusicTitle(config.music_title);
                      setEnabledFeatures((prev) => ({
                        ...prev,
                        music: config.music_enabled && config.music_source !== 'none',
                      }));
                    }}
                    onUploadStateChange={(uploading, hasErr) => {
                      setIsAudioUploading(uploading);
                      setHasAudioUploadError(hasErr);
                    }}
                  />

                  {/* Cake & Wishes */}
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Celebration Wishes & Cake Message
                    </label>
                    <div className="space-y-3">
                      {wishes.map((w, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={w}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                const max = contentLimits.fields.individualWish.maxWords;
                                if (
                                  contentLimits.fields.individualWish.enabled &&
                                  countWords(nextVal) > max &&
                                  countWords(nextVal) > countWords(w)
                                ) {
                                  return;
                                }
                                const updated = [...wishes];
                                updated[idx] = nextVal;
                                setWishes(updated);
                              }}
                              className="flex-1 px-3 py-2 rounded-xl border border-black/10 text-xs focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setWishes(wishes.filter((_, i) => i !== idx))}
                              className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                              title="Delete wish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <WordLimitIndicator
                            text={w}
                            maxWords={contentLimits.fields.individualWish.maxWords}
                            enabled={contentLimits.fields.individualWish.enabled}
                            showFeedbackText={false}
                          />
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
                    <label className="block text-xs font-semibold text-platform-text mb-2">
                      Timeline Milestones ({timelineEntries.length})
                    </label>
                    <div className="space-y-3">
                      {timelineEntries.map((t, idx) => (
                        <div key={t.id || idx} className="p-3 rounded-xl border border-platform-inputBorder bg-platform-inputBg text-platform-text space-y-2 text-xs">
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
                              const nextVal = e.target.value;
                              const max = contentLimits.fields.timelineDescription.maxWords;
                              if (
                                contentLimits.fields.timelineDescription.enabled &&
                                countWords(nextVal) > max &&
                                countWords(nextVal) > countWords(t.description)
                              ) {
                                return;
                              }
                              const up = [...timelineEntries];
                              up[idx].description = nextVal;
                              setTimelineEntries(up);
                            }}
                            placeholder="What made this moment special?"
                            className="w-full px-2 py-1 rounded border border-black/10"
                          />
                          <WordLimitIndicator
                            text={t.description}
                            maxWords={contentLimits.fields.timelineDescription.maxWords}
                            enabled={contentLimits.fields.timelineDescription.enabled}
                            showFeedbackText={false}
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
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 5: Letters & Closing Farewell
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Draft personal heartfelt letters and set an optional scheduled expiry date.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Personal Letter Content *
                    </label>
                    <textarea
                      rows={6}
                      value={letters[0]?.content || ''}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const prevVal = letters[0]?.content || '';
                        const max = contentLimits.fields.personalLetter.maxWords;
                        if (
                          contentLimits.fields.personalLetter.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(prevVal)
                        ) {
                          return;
                        }
                        const updated = [...letters];
                        if (!updated[0]) {
                          updated[0] = {
                            id: 'l1',
                            heading: 'A letter from the heart',
                            content: nextVal,
                            display_order: 1,
                          };
                        } else {
                          updated[0].content = nextVal;
                        }
                        setLetters(updated);
                      }}
                      placeholder="Write your long-form letter..."
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-xs sm:text-sm font-serif leading-relaxed focus:ring-2 focus:ring-platform-violet/40 focus:outline-none"
                    />
                    <WordLimitIndicator
                      text={letters[0]?.content || ''}
                      maxWords={contentLimits.fields.personalLetter.maxWords}
                      enabled={contentLimits.fields.personalLetter.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Closing Farewell Message
                    </label>
                    <textarea
                      rows={3}
                      value={closingMessage}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const max = contentLimits.fields.finalClosingMessage.maxWords;
                        if (
                          contentLimits.fields.finalClosingMessage.enabled &&
                          countWords(nextVal) > max &&
                          countWords(nextVal) > countWords(closingMessage)
                        ) {
                          return;
                        }
                        setClosingMessage(nextVal);
                      }}
                      placeholder="Final words at the very bottom of the card journey..."
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                    <WordLimitIndicator
                      text={closingMessage}
                      maxWords={contentLimits.fields.finalClosingMessage.maxWords}
                      enabled={contentLimits.fields.finalClosingMessage.enabled}
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
                            className="px-3 py-2 rounded-lg border border-platform-inputBorder bg-platform-inputBg text-platform-text"
                          />
                          <input
                            type="time"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-platform-inputBorder bg-platform-inputBg text-platform-text"
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
                  <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                    Page 6: Security & Final Launch
                  </h2>
                  <p className="mt-1 text-xs text-platform-muted">
                    Protect the card with a recipient password, review the link, and launch it live!
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-platform-text mb-1.5 flex items-center gap-1.5">
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
                    <label className="block text-xs font-semibold text-platform-text mb-1.5">
                      Password Hint (Displayed to Recipient)
                    </label>
                    <input
                      type="text"
                      value={passwordHint}
                      onChange={(e) => setPasswordHint(e.target.value)}
                      placeholder="e.g. The name of the cafe where we met"
                      className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                    />
                  </div>

                  {renderSlugInputSection()}

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
                      disabled={
                        isPublishing ||
                        isAudioUploading ||
                        hasAudioUploadError ||
                        !recipientName ||
                        !title ||
                        !password ||
                        slugStatus === 'checking' ||
                        slugStatus === 'taken' ||
                        slugStatus === 'reserved' ||
                        slugStatus === 'invalid'
                      }
                      className="w-full py-4 rounded-2xl bg-platform-btnBg text-platform-btnText text-sm font-semibold hover:bg-platform-btnHover transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {isPublishing
                          ? 'Publishing Gift...'
                          : isAudioUploading
                          ? 'Uploading Audio...'
                          : 'Publish Gift Now'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="mt-8 pt-5 border-t border-platform-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-platform-border text-xs font-medium text-platform-text hover:bg-platform-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-xs cursor-pointer"
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
          </>
        )}

        {/* SECTION C: Expiry / Closing Screen Editor */}
        {activeExperience === 'expiry_screen' && (
          <div className="bg-platform-card p-6 sm:p-8 rounded-3xl border border-platform-border shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-platform-border pb-4">
              <div>
                <span className="text-[11px] font-semibold text-platform-violet uppercase tracking-wider">
                  Section C • Final Closing & Expiry Screen
                </span>
                <h2 className="font-serif text-xl sm:text-2xl text-platform-text font-normal">
                  Expiry / Closing Screen Editor
                </h2>
                <p className="mt-1 text-xs text-platform-muted">
                  Customise the post-expiry farewell message, closing typography, navigation options, and expiration schedule.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-platform-violet/10 border border-platform-violet/20 flex items-center justify-center text-platform-violet shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Expiry Heading */}
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1.5">
                  Closing Heading *
                </label>
                <input
                  type="text"
                  value={expiryHeading}
                  onChange={(e) => setExpiryHeading(e.target.value)}
                  placeholder="e.g. This Little Universe Has Closed"
                  className="w-full px-4 py-3 rounded-xl border border-platform-inputBorder text-xs sm:text-sm focus:ring-2 focus:ring-platform-violet/40 focus:outline-none bg-platform-inputBg text-platform-text"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'This Little Universe Has Closed',
                    'This Surprise Has Reached Its Final Chapter',
                    'Our Special Journey Has Come to an End',
                    'Until We Meet Again in Memory',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExpiryHeading(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-platform-text transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Closing Message */}
              <div>
                <LimitedTextarea
                  label="Description & Farewell Message"
                  required
                  value={expiryMessage}
                  onChange={(val) => setExpiryMessage(val)}
                  maxWords={100}
                  rows={4}
                  placeholder="The little world created for you has now come to a close. But some moments and connections are too special to be limited by time. Thank you for being part of this little journey."
                />
              </div>

              {/* Visual Theme Selector for Expiry Page */}
              <div>
                <label className="block text-xs font-semibold text-platform-text mb-1.5">
                  Expiry Farewell Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'dreamy', name: 'Dreamy Stars', desc: 'Gentle night sky & moon emblem' },
                    { id: 'elegant', name: 'Classic Gold', desc: 'Timeless clock & gold accents' },
                    { id: 'scrapbook', name: 'Scrapbook', desc: 'Warm paper & book emblem' },
                    { id: 'celebration', name: 'Celebration', desc: 'Joyful glow & festivity' },
                    { id: 'pastel', name: 'Pastel Whisper', desc: 'Soft dreamy lavender/rose' },
                    { id: 'minimal', name: 'Modern Minimal', desc: 'Clean, understated serif' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setExpiryThemeId(th.id as ThemeId)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        expiryThemeId === th.id
                          ? 'border-platform-violet bg-platform-violet/5 ring-1 ring-platform-violet'
                          : 'border-black/10 hover:border-black/20 bg-stone-50/50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-platform-text">{th.name}</div>
                      <div className="text-[10px] text-platform-muted mt-0.5 leading-snug">{th.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-4 border-t border-black/5 space-y-3">
                <h3 className="text-xs font-semibold text-platform-text uppercase tracking-wider">
                  Navigation Controls
                </h3>

                {/* Toggle Create Your Own Gift */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-black/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-platform-text">
                        &ldquo;Create Your Own Gift&rdquo; Call to Action
                      </span>
                      <p className="text-[11px] text-platform-muted">
                        Invite the recipient to create a keepsake of their own
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={expiryShowCreateBtn}
                      onChange={(e) => setExpiryShowCreateBtn(e.target.checked)}
                      className="w-4 h-4 text-platform-violet rounded border-gray-300 focus:ring-platform-violet"
                    />
                  </div>
                  {expiryShowCreateBtn && (
                    <input
                      type="text"
                      value={expiryCreateBtnText}
                      onChange={(e) => setExpiryCreateBtnText(e.target.value)}
                      placeholder="Create Your Own Gift"
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-xs focus:ring-1 focus:ring-platform-violet focus:outline-none"
                    />
                  )}
                </div>

                {/* Toggle Return to Home */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-black/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-platform-text">
                        &ldquo;Return to Home&rdquo; Secondary Button
                      </span>
                      <p className="text-[11px] text-platform-muted">
                        Provide a clean exit back to the Dear You homepage
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={expiryShowHomeBtn}
                      onChange={(e) => setExpiryShowHomeBtn(e.target.checked)}
                      className="w-4 h-4 text-platform-violet rounded border-gray-300 focus:ring-platform-violet"
                    />
                  </div>
                  {expiryShowHomeBtn && (
                    <input
                      type="text"
                      value={expiryHomeBtnText}
                      onChange={(e) => setExpiryHomeBtnText(e.target.value)}
                      placeholder="Return to Home"
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-xs focus:ring-1 focus:ring-platform-violet focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Expiry Schedule Settings */}
              <div className="pt-4 border-t border-black/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-platform-text">
                      Automatic Expiry Schedule
                    </span>
                    <p className="text-[11px] text-platform-muted">
                      Optionally schedule the exact moment this gift closes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={expiryEnabled}
                    onChange={(e) => setExpiryEnabled(e.target.checked)}
                    className="w-4 h-4 text-platform-violet rounded border-gray-300 focus:ring-platform-violet"
                  />
                </div>

                {expiryEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-platform-text mb-1">
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
                      <label className="block text-[11px] font-medium text-platform-text mb-1">
                        Expiry Time
                      </label>
                      <input
                        type="time"
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 leading-relaxed">
                  🛡️ <strong>Preview Safety:</strong> Previewing this closing screen in Creator Studio does <em>not</em> expire your gift. Recipient gifts expire strictly when the server-side expiry threshold is reached.
                </div>
              </div>
            </div>

            {/* Navigation to other experiences */}
            <div className="pt-4 border-t border-black/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveExperience('gift_journey');
                  setPreviewStateMode('unlocked');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 text-xs font-medium text-platform-text hover:bg-black/5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Gift Journey</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveExperience('password_gate');
                  setPreviewStateMode('password_gate');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Edit Password Gate</span>
              </button>
            </div>
          </div>
        )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: LIVE GIFT PREVIEW (55% width on desktop)    */}
        {/* ======================================================== */}
        <div className="hidden lg:block lg:w-[55%] xl:w-[58%] sticky top-6 h-[calc(100vh-60px)]">
          <LivePreviewPane
            gift={previewGift}
            activeSectionId={activeSectionId}
            stateMode={previewStateMode}
            onStateModeChange={(mode) => {
              setPreviewStateMode(mode);
              if (mode === 'password_gate') setActiveExperience('password_gate');
              else if (mode === 'expired_closing') setActiveExperience('expiry_screen');
              else setActiveExperience('gift_journey');
            }}
            onSectionVisible={handlePreviewSectionVisible}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* PERSISTENT STICKY BOTTOM ACTION BAR ON MOBILE            */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-platform-card/95 backdrop-blur-md border-t border-platform-border px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 text-platform-text">
        {/* Left: Save status */}
        <div className="flex items-center gap-1.5 text-xs text-platform-muted min-w-0 truncate">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="inline-flex items-center gap-1.5 text-stone-500">
              <span className="w-2 h-2 rounded-full bg-stone-400" />
              <span>Unsaved changes</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <button
              type="button"
              onClick={() => saveDraft('draft')}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium underline"
            >
              Save failed — Retry
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => saveDraft('draft')}
            disabled={saveStatus === 'saving'}
            className="px-3 py-2 rounded-xl border border-platform-border text-xs font-medium text-platform-text active:scale-95 transition-all bg-platform-cardSubtle hover:bg-platform-hover shadow-2xs cursor-pointer"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => {
              editorScrollPosRef.current = window.scrollY;
              setShowMobilePreview(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-platform-violet text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>
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
              stateMode={previewStateMode}
              onStateModeChange={(mode) => {
                setPreviewStateMode(mode);
                if (mode === 'password_gate') setActiveExperience('password_gate');
                else if (mode === 'expired_closing') setActiveExperience('expiry_screen');
                else setActiveExperience('gift_journey');
              }}
              onSectionVisible={handlePreviewSectionVisible}
              isMobileDrawer={true}
              onCloseMobilePreview={() => {
                setShowMobilePreview(false);
                requestAnimationFrame(() => {
                  window.scrollTo({ top: editorScrollPosRef.current, behavior: 'instant' });
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GiftBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-platform-violet border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-platform-muted">Loading Gift Creator Studio...</p>
        </div>
      }
    >
      <GiftBuilderInner />
    </Suspense>
  );
}
