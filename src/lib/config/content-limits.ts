/**
 * DEAR YOU — PLATFORM CONTENT LENGTH & PHOTO UPLOAD LIMITS
 *
 * Configurable thresholds, Unicode-aware word counter (supporting English, Hindi,
 * and Indian languages), photo deduplication and server-side validation rules.
 */

export interface FieldLimitConfig {
  maxWords: number;
  enabled: boolean;
  label: string;
}

export interface PlatformContentLimits {
  maxPhotos: number;
  fields: {
    cardTitle: FieldLimitConfig;
    shortIntroduction: FieldLimitConfig;
    welcomeMessage: FieldLimitConfig;
    personalLetter: FieldLimitConfig;
    specialMessage: FieldLimitConfig;
    individualWish: FieldLimitConfig;
    memoryCaption: FieldLimitConfig;
    photoDescription: FieldLimitConfig;
    timelineDescription: FieldLimitConfig;
    secretMessage: FieldLimitConfig;
    quizQuestion: FieldLimitConfig;
    quizAnswer: FieldLimitConfig;
    finalClosingMessage: FieldLimitConfig;
    customSectionText: FieldLimitConfig;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CONTENT_LIMITS: PlatformContentLimits = {
  maxPhotos: 15,
  fields: {
    cardTitle: {
      maxWords: 10,
      enabled: true,
      label: 'Card title',
    },
    shortIntroduction: {
      maxWords: 50,
      enabled: true,
      label: 'Short introduction',
    },
    welcomeMessage: {
      maxWords: 100,
      enabled: true,
      label: 'Welcome message',
    },
    personalLetter: {
      maxWords: 300,
      enabled: true,
      label: 'Personal letter',
    },
    specialMessage: {
      maxWords: 150,
      enabled: true,
      label: 'Special message',
    },
    individualWish: {
      maxWords: 50,
      enabled: true,
      label: 'Individual wish',
    },
    memoryCaption: {
      maxWords: 30,
      enabled: true,
      label: 'Memory caption',
    },
    photoDescription: {
      maxWords: 40,
      enabled: true,
      label: 'Photo description',
    },
    timelineDescription: {
      maxWords: 50,
      enabled: true,
      label: 'Timeline description',
    },
    secretMessage: {
      maxWords: 100,
      enabled: true,
      label: 'Secret message',
    },
    quizQuestion: {
      maxWords: 30,
      enabled: true,
      label: 'Quiz question',
    },
    quizAnswer: {
      maxWords: 15,
      enabled: true,
      label: 'Quiz answer',
    },
    finalClosingMessage: {
      maxWords: 100,
      enabled: true,
      label: 'Final closing message',
    },
    customSectionText: {
      maxWords: 150,
      enabled: true,
      label: 'Custom section text',
    },
  },
};

// Runtime memory cache for active platform content limits
let activeContentLimits: PlatformContentLimits = JSON.parse(
  JSON.stringify(DEFAULT_CONTENT_LIMITS)
);

export function getPlatformContentLimits(): PlatformContentLimits {
  return activeContentLimits;
}

export function updatePlatformContentLimits(
  newLimits: Partial<PlatformContentLimits>,
  updatedBy?: string
): PlatformContentLimits {
  activeContentLimits = {
    ...activeContentLimits,
    ...newLimits,
    fields: {
      ...activeContentLimits.fields,
      ...(newLimits.fields || {}),
    },
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || activeContentLimits.updatedBy,
  };
  return activeContentLimits;
}

/**
 * Unicode and Indian Language-Aware Word Counter
 *
 * Accurately segments words for:
 * - English and Latin scripts
 * - Hindi and Devanagari scripts (handles dandas \u0964, \u0965 and conjuncts)
 * - Other Indic languages (Bengali, Tamil, Telugu, etc.)
 * - Handles multiple consecutive spaces, line breaks, tabs, and punctuation
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Use Intl.Segmenter if supported (standard in modern JavaScript environments)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      let count = 0;
      const segments = Array.from(segmenter.segment(trimmed));
      for (const segment of segments) {
        if (segment.isWordLike) {
          count++;
        }
      }
      return count;
    } catch {
      // Fall through to regex-based counting if Intl.Segmenter throws
    }
  }

  // Robust Unicode regex fallback:
  // Strip common punctuation including Indian dandas (\u0964, \u0965), smart quotes, hyphens
  const clean = trimmed
    .replace(/[\u0964\u0965\.,!?;:()[\]{}"'“”‘’—–\-_/\\`~@#$%^&*+=<>]/g, ' ')
    .trim();

  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

/**
 * Truncates or clamps text to a maximum number of words while preserving word boundaries.
 * Useful when pasting oversized text into a restricted field.
 */
export function clampToMaxWords(text: string, maxWords: number): string {
  if (!text || maxWords <= 0) return '';
  const currentCount = countWords(text);
  if (currentCount <= maxWords) return text;

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      let wordsCounted = 0;
      let lastIndex = 0;
      const segments = Array.from(segmenter.segment(text));

      for (const segment of segments) {
        if (segment.isWordLike) {
          wordsCounted++;
          if (wordsCounted > maxWords) {
            break;
          }
        }
        lastIndex = segment.index + segment.segment.length;
      }

      return text.slice(0, lastIndex).trimEnd();
    } catch {
      // Fall through
    }
  }

  const words = text.trim().split(/\s+/);
  return words.slice(0, maxWords).join(' ');
}

/**
 * Extracts all unique photo URLs/paths across card sections.
 * Ensures a photo displayed in multiple sections (e.g. Memory Wall, Memories Gallery,
 * Timeline, Cover) counts only ONCE towards the card's maximum photo limit.
 */
export function getUniquePhotos(gift: {
  memories?: Array<{ image_path?: string }>;
  timeline_entries?: Array<{ image_path?: string }>;
  cover_image?: string | null;
  [key: string]: any;
}): string[] {
  const photoSet = new Set<string>();

  // 1. Cover image
  if (gift.cover_image && typeof gift.cover_image === 'string' && gift.cover_image.trim()) {
    photoSet.add(gift.cover_image.trim());
  }

  // 2. Memory Wall & Gallery memories
  if (Array.isArray(gift.memories)) {
    for (const mem of gift.memories) {
      if (mem?.image_path && typeof mem.image_path === 'string' && mem.image_path.trim()) {
        photoSet.add(mem.image_path.trim());
      }
    }
  }

  // 3. Timeline entries
  if (Array.isArray(gift.timeline_entries)) {
    for (const entry of gift.timeline_entries) {
      if (entry?.image_path && typeof entry.image_path === 'string' && entry.image_path.trim()) {
        photoSet.add(entry.image_path.trim());
      }
    }
  }

  return Array.from(photoSet);
}

/**
 * Calculates unique photo count for a gift
 */
export function getUniquePhotoCount(gift: {
  memories?: Array<{ image_path?: string }>;
  timeline_entries?: Array<{ image_path?: string }>;
  cover_image?: string | null;
  [key: string]: any;
}): number {
  return getUniquePhotos(gift).length;
}

/**
 * Generates a warm, friendly message for word counters based on progress
 */
export function getWordCountFeedback(
  current: number,
  max: number
): {
  message: string;
  tone: 'normal' | 'warning' | 'limit' | 'exceeded';
  remaining: number;
  percentage: number;
} {
  const remaining = Math.max(0, max - current);
  const percentage = Math.min(100, Math.round((current / max) * 100));

  if (current > max) {
    return {
      message: `Existing message has ${current} words (${current - max} over the ${max}-word limit). Please shorten when editing.`,
      tone: 'exceeded',
      remaining: 0,
      percentage: 100,
    };
  }

  if (current === max) {
    return {
      message: "You've reached the word limit. Try making your message a little shorter.",
      tone: 'limit',
      remaining: 0,
      percentage: 100,
    };
  }

  if (remaining <= 10 || percentage >= 80) {
    return {
      message: `Almost there! You have ${remaining} ${remaining === 1 ? 'word' : 'words'} remaining.`,
      tone: 'warning',
      remaining,
      percentage,
    };
  }

  return {
    message: `You've written ${current} of ${max} words (${remaining} remaining).`,
    tone: 'normal',
    remaining,
    percentage,
  };
}
