/**
 * DEAR YOU — URL Slug Normalization and Validation Rules
 * Enforces slug formatting, reserved word exclusion, and uniqueness checking standards.
 */

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'developer',
  'login',
  'signup',
  'settings',
  'dashboard',
  'api',
  'auth',
  'reset-password',
  'forgot-password',
  'privacy',
  'terms',
  'demo',
  'demo-gift',
  'create',
  'verify-email',
  'verify-otp',
  'g',
  'gifts',
  'account',
  'profile',
  'logout',
  'signout',
  'public',
  'static',
  'preview',
  'edit',
  'new',
  'app',
  'welcome',
  'home',
  'index',
]);

/**
 * Normalizes a raw slug string according to platform rules:
 * 1. Lowercase letters and numbers.
 * 2. Replaces spaces and underscores with hyphens.
 * 3. Removes all other invalid characters.
 * 4. Collapses multiple consecutive hyphens into a single hyphen.
 * 5. Trims leading and trailing hyphens.
 */
export function normalizeSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
  normalized: string;
}

/**
 * Validates the formatted slug against length, pattern, and reserved route checks.
 */
export function validateSlugFormat(rawSlug: string): SlugValidationResult {
  const normalized = normalizeSlug(rawSlug);

  if (!normalized) {
    return {
      valid: false,
      error: 'Please enter a URL slug.',
      normalized: '',
    };
  }

  // Reserved keyword check
  if (RESERVED_SLUGS.has(normalized)) {
    return {
      valid: false,
      error: 'This URL slug is reserved for system use. Please choose another one.',
      normalized,
    };
  }

  if (normalized.length < 3) {
    return {
      valid: false,
      error: 'URL slug must be at least 3 characters long.',
      normalized,
    };
  }

  if (normalized.length > 60) {
    return {
      valid: false,
      error: 'URL slug cannot exceed 60 characters.',
      normalized,
    };
  }

  // Regex format: only lowercase alphanumeric segments separated by single hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalized)) {
    return {
      valid: false,
      error: 'URL slug can only contain lowercase letters, numbers, and single hyphens.',
      normalized,
    };
  }

  return {
    valid: true,
    normalized,
  };
}
