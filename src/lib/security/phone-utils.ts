/**
 * DEAR YOU — Phone Number Utilities & Normalization
 * Standardizes phone numbers to international E.164 format and provides safe masking.
 */

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  sampleLength: number;
}

export const SUPPORTED_COUNTRY_CODES: CountryCode[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', sampleLength: 10 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', sampleLength: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', sampleLength: 10 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', sampleLength: 9 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', sampleLength: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', sampleLength: 9 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', sampleLength: 8 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', sampleLength: 11 },
];

/**
 * Normalizes a phone number to standard international E.164 format:
 * e.g. "+91" and "98765 43210" => "+919876543210"
 */
export function normalizePhoneNumber(countryCode: string, rawNumber: string): string {
  const cleanCode = countryCode.trim().startsWith('+')
    ? countryCode.trim()
    : `+${countryCode.trim()}`;

  // Strip all non-digit characters from the input number
  const cleanDigits = rawNumber.replace(/\D/g, '');

  // If user already included the country code in the input digits
  const codeDigits = cleanCode.replace(/\D/g, '');
  if (cleanDigits.startsWith(codeDigits) && cleanDigits.length > codeDigits.length) {
    return `+${cleanDigits}`;
  }

  return `${cleanCode}${cleanDigits}`;
}

/**
 * Validates whether an E.164 phone number has a realistic length (8 to 15 digits total)
 */
export function isValidE164Phone(e164Phone: string): boolean {
  if (!e164Phone || !e164Phone.startsWith('+')) return false;
  const digitsOnly = e164Phone.slice(1);
  return /^\d{8,15}$/.test(digitsOnly);
}

/**
 * Masks a phone number for UI display without leaking digits.
 * e.g. "+919876543210" => "+91 98*** **210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 8) return '••••••••';

  // Extract prefix like "+91" or first 3 chars
  const prefix = clean.slice(0, 3);
  const start = clean.slice(3, 5);
  const end = clean.slice(-3);
  return `${prefix} ${start}*** **${end}`;
}

/**
 * Masks an email address for UI display.
 * e.g. "maya.sharma@example.com" => "m***a@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}***${last}@${domain}`;
}

/**
 * Generates an internal synthetic bridge email for a mobile phone number.
 * Allows mobile accounts to utilize standard Supabase Auth sessions without
 * triggering 'Phone signups are disabled' or requiring external SMS providers.
 * e.g. "+919876543210" => "919876543210@phone.dearyou.com"
 */
export function getPhoneBridgeEmail(phone: string): string {
  const cleanDigits = phone.replace(/\D/g, '');
  return `${cleanDigits}@phone.dearyou.com`;
}

/**
 * Checks whether an email address is an internal phone bridge email.
 */
export function isPhoneBridgeEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@phone.dearyou.com');
}

