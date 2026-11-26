/**
 * Dear You — Curated Royalty-Free Music Library
 * 
 * Pre-approved, licensed ambient & instrumental tracks categorized for personalized digital gifting.
 * Can be managed and extended dynamically by authorized platform developers.
 */

export type MusicCategory =
  | 'Romantic'
  | 'Birthday'
  | 'Friendship'
  | 'Peaceful'
  | 'Cinematic'
  | 'Celebration'
  | 'Instrumental'
  | 'Emotional';

export interface MusicTrack {
  id: string;
  title: string;
  category: MusicCategory;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "3:05"
  artist: string;
  attribution?: string;
  audio_url: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

export const MUSIC_CATEGORIES: { id: MusicCategory; label: string; icon: string }[] = [
  { id: 'Romantic', label: 'Romantic', icon: 'Heart' },
  { id: 'Birthday', label: 'Birthday', icon: 'Cake' },
  { id: 'Friendship', label: 'Friendship', icon: 'Smile' },
  { id: 'Peaceful', label: 'Peaceful', icon: 'Feather' },
  { id: 'Cinematic', label: 'Cinematic', icon: 'Sparkles' },
  { id: 'Celebration', label: 'Celebration', icon: 'PartyPopper' },
  { id: 'Instrumental', label: 'Instrumental', icon: 'Music' },
  { id: 'Emotional', label: 'Emotional', icon: 'Sun' },
];

export const DEAR_YOU_MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'lib-gentle-moments',
    title: 'Gentle Moments',
    category: 'Romantic',
    duration: 184,
    durationFormatted: '3:04',
    artist: 'Dear You Originals',
    attribution: 'Licensed for Dear You Digital Keepsakes',
    audio_url: '/audio/gentle-moments.mp3',
    description: 'Warm, soft acoustic piano with delicate strings for intimate love notes.',
    is_active: true,
    display_order: 1,
  },
  {
    id: 'lib-celestial-waltz',
    title: 'Celestial Waltz',
    category: 'Cinematic',
    duration: 212,
    durationFormatted: '3:32',
    artist: 'Acoustic Reverie',
    attribution: 'Royalty-Free Keepsake Ensemble',
    audio_url: '/audio/celestial-waltz.mp3',
    description: 'Grand orchestral waltz evoking sweeping cinematic memories and wonder.',
    is_active: true,
    display_order: 2,
  },
  {
    id: 'lib-joyful-celebration',
    title: 'Joyful Celebration',
    category: 'Birthday',
    duration: 156,
    durationFormatted: '2:36',
    artist: 'Sunny Day Ensemble',
    attribution: 'Creative Commons 0 / Dear You Master',
    audio_url: '/audio/joyful-celebration.mp3',
    description: 'Breezy acoustic guitars and uplifting chimes for celebratory milestones.',
    is_active: true,
    display_order: 3,
  },
  {
    id: 'lib-cherished-memories',
    title: 'Cherished Memories',
    category: 'Friendship',
    duration: 198,
    durationFormatted: '3:18',
    artist: 'Kindred Spirits',
    attribution: 'Dear You Authorized Library',
    audio_url: '/audio/cherished-memories.mp3',
    description: 'Nostalgic folk-acoustic picking celebrating years of companionship.',
    is_active: true,
    display_order: 4,
  },
  {
    id: 'lib-serene-horizon',
    title: 'Serene Horizon',
    category: 'Peaceful',
    duration: 225,
    durationFormatted: '3:45',
    artist: 'Morning Mist',
    attribution: 'Dear You Authorized Library',
    audio_url: '/audio/serene-horizon.mp3',
    description: 'Calm ambient pads and soft harp glissandos for peaceful reflections.',
    is_active: true,
    display_order: 5,
  },
  {
    id: 'lib-sparkling-fireworks',
    title: 'Sparkling Fireworks',
    category: 'Celebration',
    duration: 175,
    durationFormatted: '2:55',
    artist: 'Festive Strings Guild',
    attribution: 'Dear You Soundworks',
    audio_url: '/audio/sparkling-fireworks.mp3',
    description: 'Vibrant orchestral crescendos, bells, and joyous festive harmonies.',
    is_active: true,
    display_order: 6,
  },
  {
    id: 'lib-velvet-reverie',
    title: 'Velvet Reverie',
    category: 'Instrumental',
    duration: 192,
    durationFormatted: '3:12',
    artist: 'Midnight Keys',
    attribution: 'Dear You Master Archive',
    audio_url: '/audio/velvet-reverie.mp3',
    description: 'Solo acoustic grand piano with natural felt hammer resonance.',
    is_active: true,
    display_order: 7,
  },
  {
    id: 'lib-timeless-echoes',
    title: 'Timeless Echoes',
    category: 'Emotional',
    duration: 204,
    durationFormatted: '3:24',
    artist: 'Solace Strings',
    attribution: 'Licensed for Dear You Platform',
    audio_url: '/audio/timeless-echoes.mp3',
    description: 'Deep expressive cello layered over soft ambient chords for heartfelt letters.',
    is_active: true,
    display_order: 8,
  },
];

/**
 * Format raw seconds into standard mm:ss display
 */
export function formatAudioSeconds(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse standard mm:ss format into integer seconds
 */
export function parseAudioSeconds(formatted: string): number {
  if (!formatted) return 0;
  const parts = formatted.trim().split(':');
  if (parts.length === 1) {
    const s = parseFloat(parts[0]);
    return isNaN(s) ? 0 : s;
  }
  const minutes = parseFloat(parts[0]) || 0;
  const seconds = parseFloat(parts[1]) || 0;
  return Math.max(0, minutes * 60 + seconds);
}

/**
 * Find library track by ID or fallback to default
 */
export function getMusicTrackById(trackId?: string): MusicTrack | undefined {
  if (!trackId) return undefined;
  return DEAR_YOU_MUSIC_LIBRARY.find((t) => t.id === trackId && t.is_active);
}

/**
 * Default fallback library track
 */
export const DEFAULT_LIBRARY_TRACK = DEAR_YOU_MUSIC_LIBRARY[0];
