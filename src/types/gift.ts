import { CustomThemeConfig, ThemeId } from './theme';

export type EventType =
  | 'Birthday'
  | 'Anniversary'
  | 'Friendship'
  | 'Appreciation'
  | 'Celebration'
  | 'Other';

export type GiftStatus = 'draft' | 'published' | 'archived' | 'expired';

export type SectionType =
  | 'welcome'
  | 'gift_box'
  | 'celebration'
  | 'memory_wall'
  | 'memories'
  | 'timeline'
  | 'quiz'
  | 'scratch_card'
  | 'secret_messages'
  | 'future_wishes'
  | 'letters'
  | 'music'
  | 'closing';

export type FrameStyle =
  | 'polaroid'
  | 'vintage_wood'
  | 'minimal'
  | 'golden_luxury'
  | 'scrapbook'
  | 'pastel'
  | 'theme_custom';

export type FrameSize = 'small' | 'medium' | 'large';

export interface MemoryItem {
  id: string;
  gift_id?: string;
  image_path: string;
  caption: string;
  memory_date?: string;
  display_order: number;
  frame_style?: FrameStyle;
  frame_size?: FrameSize;
  rotation?: number; // in degrees, e.g. -5 to 5
  position_x?: number; // relative coordinate for manual wall layout
  position_y?: number;
}

export type WallLayoutMode = 'auto' | 'manual' | 'both';

export interface MemoryWallConfig {
  layout_mode: WallLayoutMode;
  wall_spacing?: 'compact' | 'comfortable' | 'spacious';
  enable_hanging_effect?: boolean;
  wall_background?: string;
}

export interface TimelineEntry {
  id: string;
  gift_id?: string;
  title: string;
  description: string;
  image_path?: string;
  event_date: string;
  display_order: number;
}

export interface QuizOption {
  id: string;
  question_id?: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

export interface QuizQuestion {
  id: string;
  gift_id?: string;
  question: string;
  display_order: number;
  options: QuizOption[];
}

export interface GiftLetter {
  id: string;
  gift_id?: string;
  heading: string;
  content: string;
  display_order: number;
}

export interface GiftWish {
  id: string;
  gift_id?: string;
  wish_text: string;
  display_order: number;
}

export interface SecretMessage {
  id: string;
  gift_id?: string;
  title: string;
  content: string;
  reveal_type: 'tap' | 'password';
  display_order: number;
}

export interface GiftSection {
  id: string;
  gift_id?: string;
  section_type: SectionType;
  display_order: number;
  enabled: boolean;
  section_config?: Record<string, any>;
}

export interface Gift {
  id: string;
  owner_id?: string;
  recipient_name: string;
  title: string;
  slug: string;
  event_type: EventType;
  event_date?: string;
  cover_image?: string;
  introduction?: string;
  welcome_heading?: string;
  welcome_message?: string;
  welcome_button_text?: string;
  
  // Theme
  selected_theme: ThemeId;
  theme_config?: CustomThemeConfig;
  
  // Status
  status: GiftStatus;
  
  // Password & Access
  password_hash?: string;
  password_hint?: string;
  
  // Expiry configuration
  expiry_enabled: boolean;
  expires_at?: string | null; // ISO UTC string
  expiry_timezone: string; // e.g. "Asia/Kolkata"
  expiry_heading?: string;
  expiry_message?: string;
  
  // Music & Interactive configs
  music_url?: string;
  music_title?: string;
  scratch_card_hidden_text?: string;
  gift_box_message?: string;
  closing_message?: string;
  
  // Memory Wall & Gallery configs
  memory_wall_config?: MemoryWallConfig;
  
  // Relational details
  sections?: GiftSection[];
  memories?: MemoryItem[];
  timeline_entries?: TimelineEntry[];
  quiz_questions?: QuizQuestion[];
  letters?: GiftLetter[];
  wishes?: GiftWish[];
  secret_messages?: SecretMessage[];
  
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicGiftMeta {
  id: string;
  recipient_name: string;
  title: string;
  slug: string;
  event_type: EventType;
  selected_theme: ThemeId;
  theme_config?: CustomThemeConfig;
  status: GiftStatus;
  password_hint?: string;
  expiry_enabled: boolean;
  expires_at?: string | null;
  expiry_timezone: string;
  is_expired: boolean;
  expiry_heading?: string;
  expiry_message?: string;
}
